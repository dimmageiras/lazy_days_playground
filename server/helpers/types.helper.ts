import { exec } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import path from "path";
import type { GenerateApiConfiguration } from "swagger-typescript-api";
import { generateApi } from "swagger-typescript-api";

import { PinoLogHelper } from "./pino-log.helper.ts";

const execAsync = promisify(exec);

const generateRouteTypes = async ({
  cleanOnFirstRun,
  routePath,
  serverUrl,
}: {
  cleanOnFirstRun: boolean;
  routePath: string;
  serverUrl: string;
}): Promise<void> => {
  const { log } = PinoLogHelper;

  const fileName = `${routePath.replace("/", "-")}.type.ts`;

  try {
    log.info("🔄 Generating API types from OpenAPI spec...");

    await generateApi({
      cleanOutput: cleanOnFirstRun,
      codeGenConstructs: (struct) => ({
        Keyword: {
          ...struct.Keyword,
          Any: "unknown",
        },
      }),
      extractResponseBody: true,
      extractResponseError: true,
      fileName,
      generateClient: false,
      generateRouteTypes: false,
      moduleNameFirstTag: true,
      output: path.resolve(process.cwd(), "./shared/types/generated"),
      sortTypes: true,
      url: `${serverUrl}/api/docs/swagger/json`,
    } as Partial<GenerateApiConfiguration["config"]>);

    const outputDir = path.resolve(process.cwd(), "./shared/types/generated");
    const generatedFilePath = path.join(outputDir, fileName);

    if (fs.existsSync(generatedFilePath)) {
      let content = fs.readFileSync(generatedFilePath, "utf8");

      const lines = content.split("\n");

      if (lines.length > 3) {
        content = lines.slice(3).join("\n");
        fs.writeFileSync(generatedFilePath, content);
      }
    }

    try {
      await execAsync(`npx eslint "${generatedFilePath}" --fix`, {
        cwd: process.cwd(),
      });
    } catch (eslintError) {
      if (fs.existsSync(generatedFilePath)) {
        log.warn("⚠️ ESLint completed with warnings (this is normal)");
      } else {
        log.error({
          message: "❌ ESLint failed to process generated file",
          error:
            eslintError instanceof Error
              ? eslintError.message
              : String(eslintError),
        });
      }
    }

    log.info(`✅ API types generated successfully for ${routePath}!`);
  } catch (error) {
    log.error({
      message: "❌ Failed to generate API types",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const TypesHelper = { generateRouteTypes };
