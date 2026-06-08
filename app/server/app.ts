import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { AppEnvHelper } from "./helpers/app-env.helper";
import { GracefulShutdownModule } from "./modules/graceful-shutdown";
import { LoggerModule } from "./modules/logger";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { setupGracefulShutdown } = GracefulShutdownModule;
const { buildLogger } = LoggerModule;

const buildApp = async (
  env: ViteAppEnv,
  hot: ImportMeta["hot"],
): Promise<APIAppInstance> => {
  const appEnv = buildAppEnv(env);

  const instance: APIAppInstance = fastify({
    loggerInstance: buildLogger(appEnv),
    requestTimeout: SECONDS_TEN,
  });

  try {
    instance.decorate("appEnv", appEnv);

    await instance.register(healthRoutes, {
      prefix: API_HEALTH,
    });

    await setupGracefulShutdown(instance);

    if (hot) {
      hot.dispose(async () => {
        await instance.close();
      });

      hot.accept();
    }

    await instance.ready();

    return instance;
  } catch (rawError) {
    const error =
      rawError instanceof Error ? rawError : new Error(`${rawError}`);

    instance.log.error(
      { error: error.message, stack: error.stack },
      "💥 Failed to build the app",
    );

    try {
      await instance.close();
    } catch (rawCloseError) {
      const closeError =
        rawCloseError instanceof Error
          ? rawCloseError
          : new Error(`${rawCloseError}`);

      instance.log.error(
        { error: closeError.message, stack: closeError.stack },
        "💥 Failed to close the app after a build failure",
      );
    }

    throw error;
  }
};

export { buildApp };
