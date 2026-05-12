import type { FastifyInstance } from "fastify";
import { RoutesInit } from "./routes";

const { initRoutesPlugins } = RoutesInit;

const inits = async (app: FastifyInstance): Promise<void> => {
  try {
    await initRoutesPlugins(app);
  } catch (error) {
    app.log.fatal({ err: error }, "Route initialization failed.");
    process.exit(1);
  }
};

export { inits };
