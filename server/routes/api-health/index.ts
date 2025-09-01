import type { FastifyInstance } from "fastify";

import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { databaseRoute } from "./database.route.ts";
import { serverRoute } from "./server.route.ts";

/**
 * Api health check routes for monitoring server and database status
 */
const apiHealthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const { log } = PinoLogHelper;

  await databaseRoute(fastify, log);
  await serverRoute(fastify, log);
};

export { apiHealthRoutes };
