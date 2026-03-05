import type { FastifyInstance } from "fastify";

import { csrfTokenRoute } from "./csrf-token/index.ts";

const securityRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await csrfTokenRoute(fastify);
};

export { securityRoutes };
