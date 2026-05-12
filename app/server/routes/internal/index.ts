import type { FastifyInstance } from "fastify";

import { shutdownRoute } from "./shutdown.route";

const internalRoutes = async (app: FastifyInstance): Promise<void> => {
  await shutdownRoute(app);
};

export { internalRoutes };
