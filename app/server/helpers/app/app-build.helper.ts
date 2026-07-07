import fastify from "fastify";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { SetupDbFunction } from "@server/modules/db";
import type { BuildLoggerFunction } from "@server/modules/logger";
import type {
  SetupDocsFunction,
  SetupValidationFunction,
} from "@server/modules/openapi";
import type {
  RedactPaths,
  SetupShutdownFunction,
} from "@server/modules/shutdown";
import { apiHealthRoutes } from "@server/routes/api/health";
import type { AppInstance } from "@server/types/instance.type";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { normalizeError, toError } = ErrorHelper;

const build = async (
  env: ViteAppEnv,
  hot: ImportMeta["hot"],
  modules: {
    db: {
      setupDb: SetupDbFunction;
    };
    logger: {
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
  },
): Promise<AppInstance> => {
  const {
    db: { setupDb },
    logger: { buildLogger },
    openapi: { setupDocs, setupValidation },
    shutdown: { redactPaths, setupShutdown },
  } = modules;
  const appEnv = buildAppEnv(env);

  const instance: AppInstance = fastify({
    disableRequestLogging: true,
    loggerInstance: buildLogger(appEnv, [...redactPaths]),
    requestTimeout: SECONDS_TEN,
  });

  try {
    instance.decorate("appEnv", appEnv);

    setupDb(instance);

    await setupValidation(instance);
    await setupDocs(instance);

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

const AppBuildHelper = Object.freeze({
  build,
} as const);

export { AppBuildHelper };
