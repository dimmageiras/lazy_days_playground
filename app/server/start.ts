import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { BASE_URLS } from "./constants/base-urls.constant";
import { EnvVarHelper } from "./helpers/env-var.helper";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;
const { validateEnv } = EnvVarHelper;

let validatedEnv: ViteAppEnv;

try {
  validatedEnv = validateEnv(import.meta.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exit(1);
}

const { VITE_APP_PORT, VITE_APP_SERVICE_NAME } = validatedEnv;

const instance: APIAppInstance = fastify({
  disableRequestLogging: true,
  logger: true,
  requestTimeout: SECONDS_TEN,
});

instance.decorate("appEnv", {
  port: VITE_APP_PORT,
  serviceName: VITE_APP_SERVICE_NAME,
});

try {
  await instance.register(healthRoutes, {
    prefix: API_HEALTH,
  });

  await instance.listen({ port: VITE_APP_PORT });
} catch (error) {
  instance.log.error(error);

  try {
    await instance.close();
  } catch (closeError) {
    instance.log.error(closeError);
  }

  process.exit(1);
}
