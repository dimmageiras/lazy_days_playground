import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { AppEnvHelper } from "./helpers/app-env.helper";
import { ErrorHelper } from "./helpers/error.helper";
import { LoggerModule } from "./modules/logger";
import { ShutdownModule } from "./modules/shutdown";
import { healthRoutes } from "./routes/app/health/health.route";
import type { AppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { normalizeError, toError } = ErrorHelper;
const { buildLogger } = LoggerModule;
const { redactPaths, setupShutdown } = ShutdownModule;

const buildApp = async (
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

    await instance.register(healthRoutes, {
      prefix: API_HEALTH,
    });

    await setupShutdown(instance);

    if (hot) {
      hot.dispose(async () => {
        try {
          await instance.close();
        } catch (rawError) {
          instance.log.error(
            normalizeError(rawError),
            "💥 Failed to close the instance during hot-reload dispose",
          );
        }
      });

      hot.accept();
    }

    await instance.ready();

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

export { buildApp };
