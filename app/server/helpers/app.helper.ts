import fastify from "fastify";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { Logger } from "@server/modules/logger";
import type { BuildLoggerFunction } from "@server/modules/logger/types/logger.type";
import type { SetupShutdownFunction } from "@server/modules/shutdown";
import type { RedactPaths } from "@server/modules/shutdown/types/shutdown.type";
import { apiHealthRoutes } from "@server/routes/api/health";
import type { AppInstance } from "@server/types/instance.type";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";
import { EnvVarHelper } from "./env-var.helper";
import { ErrorHelper } from "./error.helper";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { isEnvValidationError, validateEnv } = EnvVarHelper;
const { normalizeError, toError } = ErrorHelper;

const build = async (
  env: ViteAppEnv,
  hot: ImportMeta["hot"],
  modules: {
    logger: {
      buildLogger: BuildLoggerFunction;
    };
    shutdown: {
      redactPaths: RedactPaths;
      setupShutdown: SetupShutdownFunction;
    };
  },
): Promise<AppInstance> => {
  const {
    logger: { buildLogger },
    shutdown: { redactPaths, setupShutdown },
  } = modules;
  const appEnv = buildAppEnv(env);

  const instance: AppInstance = fastify({
    loggerInstance: buildLogger(appEnv, [...redactPaths]),
    requestTimeout: SECONDS_TEN,
  });

  try {
    instance.decorate("appEnv", appEnv);

    await instance.register(apiHealthRoutes, {
      prefix: API_HEALTH,
    });

    await setupShutdown(instance, hot);

    return instance;
  } catch (rawError) {
    const error = toError(rawError);

    instance.log.error(normalizeError(error), "💥 Failed to build the app");

    try {
      await instance.close();
    } catch (rawCloseError) {
      instance.log.error(
        normalizeError(rawCloseError),
        "💥 Failed to close the app after a build failure",
      );
    }

    throw error;
  }
};

const start = async (
  env: ImportMetaEnv,
  hot: ImportMeta["hot"],
  modules: {
    logger: {
      buildFallbackLogger: () => Logger;
      buildLogger: BuildLoggerFunction;
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
    logger: { buildFallbackLogger, buildLogger },
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
      logger: { buildLogger },
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

const AppHelper = Object.freeze({
  start,
} as const);

export { AppHelper };
