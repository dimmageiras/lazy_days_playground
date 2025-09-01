import type { FastifyInstance } from "fastify";

import { databaseRoute } from "./database.route.ts";
import { serverRoute } from "./server.route.ts";

/**
 * Api health check routes for monitoring server and database status
 */
const apiHealthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await databaseRoute(fastify);
  await serverRoute(fastify);
};

export { apiHealthRoutes };
