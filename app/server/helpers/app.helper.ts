import fastify from "fastify";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { LoggerModule } from "@server/modules/logger";
import { ShutdownModule } from "@server/modules/shutdown";
import { apiHealthRoutes } from "@server/routes/api/health";
import type { AppInstance } from "@server/types/instance.type";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";
import { ErrorHelper } from "./error.helper";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { normalizeError, toError } = ErrorHelper;
const { buildLogger } = LoggerModule;
const { redactPaths, setupShutdown } = ShutdownModule;

const build = async (
  env: ViteAppEnv,
  hot: ImportMeta["hot"],
): Promise<AppInstance> => {
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

const AppHelper = Object.freeze({
  build,
} as const);

export { AppHelper };
