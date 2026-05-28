import fastify from "fastify";

import { APP_PORT } from "@shared/constants/app-env.constant";
import { TIMING_IN_MS } from "@shared/constants/timing.constant";

import { BASE_URLS } from "./constants/base-urls.constant";
import { EnvVarHelper } from "./helpers/env-var.helper";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

try {
  const { validateEnv } = EnvVarHelper;

  validateEnv(import.meta.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exit(1);
}

const instance: APIAppInstance = fastify({
  disableRequestLogging: true,
  logger: true,
  requestTimeout: SECONDS_TEN,
});

try {
  await instance.register(healthRoutes, {
    prefix: API_HEALTH,
  });

  await instance.listen({ port: Number(APP_PORT) });
} catch (error) {
  instance.log.error(error);
  await instance.close();
  process.exit(1);
}
