import type { SetupDbFunction } from "@server/modules/db";
import type {
  BuildFallbackLoggerFunction,
  BuildLoggerFunction,
} from "@server/modules/logger";
import type {
  SetupDocsFunction,
  SetupValidationFunction,
} from "@server/modules/openapi";
import type {
  RedactPaths,
  SetupShutdownFunction,
} from "@server/modules/shutdown";
import type { AppInstance } from "@server/types/instance.type";

import type { ViteAppEnv } from "@shared/types/app-env.type";

import { ErrorHelper } from "../error.helper";
import { AppBuildHelper } from "./app-build.helper";
import { EnvVarHelper } from "./env-var.helper";

const { build } = AppBuildHelper;
const { isEnvValidationError, validateEnv } = EnvVarHelper;
const { normalizeError } = ErrorHelper;

const start = async (
  env: ImportMetaEnv,
  hot: ImportMeta["hot"],
  modules: {
    db: {
      setupDb: SetupDbFunction;
    };
    logger: {
      buildFallbackLogger: BuildFallbackLoggerFunction;
      buildLogger: BuildLoggerFunction;
    };
    openapi: {
      setupDocs: SetupDocsFunction;
      setupValidation: SetupValidationFunction;
    };
    shutdown: {
      redactPaths: RedactPaths;
      setupShutdown: SetupShutdownFunction;
    };
    startup: {
      claimPort: (instance: AppInstance) => Promise<void>;
    };
  },
): Promise<void> => {
  const {
    db: { setupDb },
    logger: { buildFallbackLogger, buildLogger },
    openapi: { setupDocs, setupValidation },
    shutdown: { redactPaths, setupShutdown },
    startup: { claimPort },
  } = modules;

  let validatedEnv: ViteAppEnv;

  try {
    validatedEnv = validateEnv(env);
  } catch (error) {
    const fallbackLogger = buildFallbackLogger();

    if (isEnvValidationError(error)) {
      fallbackLogger.fatal(
        normalizeError(error),
        "💥 Failed to validate the environment",
      );
    } else {
      fallbackLogger.fatal(
        normalizeError(error),
        "💥 Unexpected error while validating the environment",
      );
    }

    process.exit(1);
  }

  let instance: AppInstance | undefined;

  try {
    instance = await build(validatedEnv, hot, {
      db: { setupDb },
      logger: { buildLogger },
      openapi: { setupDocs, setupValidation },
      shutdown: { redactPaths, setupShutdown },
    });

    await claimPort(instance);
  } catch (rawError) {
    const normalizedError = normalizeError(rawError);

    if (!instance) {
      const fallbackLogger = buildFallbackLogger();

      fallbackLogger.fatal(normalizedError, "💥 Failed to start the server");

      process.exit(1);
    }

    instance.log.fatal(normalizedError, "💥 Failed to start the server");

    try {
      await instance.close();
    } catch (rawCloseError) {
      instance.log.fatal(
        normalizeError(rawCloseError),
        "💥 Failed to close the server after a startup failure",
      );
    }

    instance.log.flush(() => process.exit(1));
  }
};

const AppStartHelper = Object.freeze({
  start,
} as const);

export { AppStartHelper };
