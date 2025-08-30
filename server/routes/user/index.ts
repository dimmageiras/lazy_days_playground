import type { FastifyInstance } from "fastify";

import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { profileRoute } from "./profile.route.ts";

/**
 * User profile routes
 * All routes in this plugin require authentication
 * @param fastify - Fastify instance
 */
const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  const { log } = PinoLogHelper;

  await profileRoute(fastify, log);
};

export { userRoutes };
