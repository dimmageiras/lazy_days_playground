import type { FastifyInstance } from "fastify";
import { bootstrapServer } from "../../modules/bootstrap/bootstrap.module";
import { SERVER_SETTINGS } from "../../constants/server.constant";

const { PORT, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const shutdownRoute = async (app: FastifyInstance): Promise<void> => {
  const { shutdownRoute, shutdownRouteOptions } = bootstrapServer({
    app,
    options: { port: PORT, token: SHUTDOWN_TOKEN },
  });
};

export { shutdownRoute };
