import type { FastifyInstance } from "fastify";
import { access, constants, readFile, writeFile } from "node:fs/promises";
import path from "path";
import type { GenerateApiConfiguration } from "swagger-typescript-api";
import { generateApi } from "swagger-typescript-api";

import type { SWAGGER_ROUTES } from "@server/constants/swagger-routes.constant";

import { ObjectUtilsHelper } from "../../shared/helpers/object-utils.helper.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

type OpenAPIV3_1_Document = Extract<
  ReturnType<FastifyInstance["swagger"]>,
  { openapi: string }
>;

const generateContractsForRoute = async ({
  cleanOnFirstRun,
  routePath,
  spec,
}: {
  cleanOnFirstRun: boolean;
  routePath: (typeof SWAGGER_ROUTES)[keyof typeof SWAGGER_ROUTES];
  spec: OpenAPIV3_1_Document;
}): Promise<void> => {
  const { getObjectEntries, isPlainObject } = ObjectUtilsHelper;
  const { log } = PinoLogHelper;

  const fileName = `${routePath.replace("/", "-")}.type.ts`;
  const output = path.resolve(process.cwd(), "./shared/types/generated");

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
    extractResponseBody: true,
    extractResponseError: true,
    fileName,
    generateClient: false,
    generateRouteTypes: false,
    output,
    sortTypes: true,
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
    log.error(error);
  }

  log.info(`✅ Generated types for route: ${routePath} (${fileName})`);
};

export const TypesHelper = { generateContractsForRoute };
