import type { FastifyInstance } from "fastify";

import { profileRoute } from "./profile.route.ts";

/**
 * User profile routes
 * All routes in this plugin require authentication
 * @param fastify - Fastify instance
 */
const userRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await profileRoute(fastify);
};

export { userRoutes };
