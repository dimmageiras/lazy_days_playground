import type { FastifyInstance } from "fastify";

import { internalRoutes } from "../../routes/internal";

const registerInternalRoutes = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(internalRoutes);
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
