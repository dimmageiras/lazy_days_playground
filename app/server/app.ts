import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { AppEnvHelper } from "./helpers/app-env.helper";
import { PinoLoggerModule } from "./modules/pino-logger";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { buildAppEnv } = AppEnvHelper;
const { buildLogger } = PinoLoggerModule;

const buildApp = async (env: ViteAppEnv): Promise<APIAppInstance> => {
  const appEnv = buildAppEnv(env);

  const instance: APIAppInstance = fastify({
    disableRequestLogging: false,
    loggerInstance: buildLogger(appEnv),
    requestTimeout: SECONDS_TEN,
  });

  try {
    instance.decorate("appEnv", appEnv);

    await instance.register(healthRoutes, {
      prefix: API_HEALTH,
    });

    await instance.ready();

    return instance;
  } catch (error) {
    instance.log.error(error);

    try {
      await instance.close();
    } catch (closeError) {
      instance.log.error(closeError);
    }

    throw error;
  }
};

export { buildApp };
