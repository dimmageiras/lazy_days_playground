import fastify from "fastify";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";

import { ROUTES } from "./constants/routes.constant";
import { healthRoutes } from "./routes/app/health/health.route";
import type { APIAppInstance } from "./types/instance.type";

const {
  API: {
    BASE: API_BASE,
    HEALTH: { BASE: HEALTH_BASE },
  },
} = ROUTES;
const { SECONDS_TEN } = TIMING_IN_MS;

const instance: APIAppInstance = fastify({
  disableRequestLogging: true,
  logger: true,
  requestTimeout: SECONDS_TEN,
});

try {
  await instance.register(healthRoutes, {
    prefix: `${API_BASE}/${HEALTH_BASE}`,
  });

  await instance.listen({ port: 5173 });
} catch (error) {
  instance.log.error(error);
  await instance.close();
  process.exit(1);
}
