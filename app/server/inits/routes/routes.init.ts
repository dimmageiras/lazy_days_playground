import type { FastifyInstance } from "fastify";

import { ROUTES } from "../../constants/routes.constant";
import { internalRoutes } from "../../routes/internal";

const { INTERNAL_BASE } = ROUTES;

const registerInternalRoutes = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(internalRoutes, { prefix: INTERNAL_BASE });
  } catch (error) {
    app.log.fatal({ err: error }, "Internal routes registration failed.");
    process.exit(1);
  }
};

const initRoutesPlugins = async (app: FastifyInstance): Promise<void> => {
  await registerInternalRoutes(app);
};

const RoutesInit = Object.freeze({
  initRoutesPlugins,
} as const);

export { RoutesInit };
