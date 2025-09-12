import type { FastifyInstance } from "fastify";

import { databaseRoute } from "./database/index.ts";
import { serverRoute } from "./server/index.ts";

const apiHealthRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await databaseRoute(fastify);
  await serverRoute(fastify);
};

export { apiHealthRoutes };
