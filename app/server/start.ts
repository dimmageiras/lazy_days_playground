import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";

import { BASE_URLS } from "./constants/base-urls.constant";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const instance: APIAppInstance = fastify({
  disableRequestLogging: true,
  logger: true,
  requestTimeout: SECONDS_TEN,
});

try {
  await instance.register(healthRoutes, {
    prefix: API_HEALTH,
  });

  await instance.listen({ port: 5173 });
} catch (error) {
  instance.log.error(error);
  await instance.close();
  process.exit(1);
}
