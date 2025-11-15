import type { FastifyInstance } from "fastify";
import { exec } from "node:child_process";
import { access, constants, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "path";
import type { GenerateApiConfiguration } from "swagger-typescript-api";
import { generateApi } from "swagger-typescript-api";

import type { SWAGGER_ROUTES } from "@server/constants/swagger-routes.constant";

import { ObjectUtilsHelper } from "../../shared/helpers/object-utils.helper.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const execAsync = promisify(exec);

type OpenAPIV3_1_Document = Extract<
  ReturnType<FastifyInstance["swagger"]>,
  { openapi: string }
>;

const generateContractsForRoute = async ({
  cleanOnFirstRun,
  routePath,
  spec,
  isLastRoute,
}: {
  cleanOnFirstRun: boolean;
  routePath: (typeof SWAGGER_ROUTES)[keyof typeof SWAGGER_ROUTES];
  spec: OpenAPIV3_1_Document;
  isLastRoute: boolean;
}): Promise<void> => {
  const { getObjectEntries, isPlainObject } = ObjectUtilsHelper;
  const { log } = PinoLogHelper;

  const fileName = `${routePath.replace("/", "-")}.type.ts`;
  const output = path.resolve(process.cwd(), "./shared/types/generated/server");

  if (!isPlainObject(spec)) {
    throw new Error("❌ Spec is not an object");
  }

  if (!isPlainObject(spec.paths)) {
    throw new Error("❌ Spec.paths is not an object");
  }

  const { paths, ...specRest } = spec;

  const filteredPaths = Object.fromEntries(
    getObjectEntries(paths).filter(([key]) => {
      const pathPrefix = `/${routePath}`;

      return key === pathPrefix || key.startsWith(`${pathPrefix}/`);
    })
  );

  const filteredSpec = { ...specRest, paths: filteredPaths };

  await generateApi({
    cleanOutput: cleanOnFirstRun,
    codeGenConstructs: (struct) => ({
      Keyword: { ...struct.Keyword, Any: "unknown" },
    }),
    extractRequestBody: true,
    extractRequestParams: true,
    extractResponseBody: true,
    extractResponseError: true,
    extractResponses: true,
    fileName,
    generateClient: false,
    generateRouteTypes: false,
    output,
    sortTypes: true,
    silent: true,
    spec: filteredSpec,
    templates: path.resolve(process.cwd(), "./server/templates"),
  } satisfies Partial<GenerateApiConfiguration["config"]>);

  const generatedFilePath = path.join(output, fileName);

  try {
    await access(generatedFilePath, constants.F_OK);

    let content = await readFile(generatedFilePath, "utf8");

    const lines = content.split("\n");

    if (lines.length > 3) {
      content = lines.slice(3).join("\n");
      await writeFile(generatedFilePath, content);
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        filePath: generatedFilePath,
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to process generated file"
    );
  }

  if (isLastRoute) {
    try {
      const generatedDir = path.join(output, "*.ts");

      await execAsync(`npx eslint --fix "${generatedDir}"`);
    } catch (_eslintError) {
      log.warn(
        "⚠️  ESLint had warnings/errors for generated files (this is expected)"
      );
    }
  }
};

export const TypesHelper = { generateContractsForRoute };
