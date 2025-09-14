import type { FastifyInstance } from "fastify";

import { checkEmailRoute } from "./check-email/index.ts";

const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await checkEmailRoute(fastify);
};

export { userRoutes };
