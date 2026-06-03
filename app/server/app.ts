import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const buildApp = (env: ViteAppEnv): APIAppInstance => {
  const { VITE_APP_PORT, VITE_APP_SERVICE_NAME } = env;

  const instance: APIAppInstance = fastify({
    disableRequestLogging: true,
    logger: true,
    requestTimeout: SECONDS_TEN,
  });

  instance.decorate("appEnv", {
    port: VITE_APP_PORT,
    serviceName: VITE_APP_SERVICE_NAME,
  });

  instance.register(healthRoutes, {
    prefix: API_HEALTH,
  });

  return instance;
};

export { buildApp };
