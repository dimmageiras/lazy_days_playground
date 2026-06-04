import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { AppEnvHelper } from "./helpers/app-env.helper";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { buildAppEnv } = AppEnvHelper;
const { SECONDS_TEN } = TIMING_IN_MS;

const buildApp = async (env: ViteAppEnv): Promise<APIAppInstance> => {
  const instance: APIAppInstance = fastify({
    disableRequestLogging: true,
    logger: true,
    requestTimeout: SECONDS_TEN,
  });

  try {
    instance.decorate("appEnv", buildAppEnv(env));

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
