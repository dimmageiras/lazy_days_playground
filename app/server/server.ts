import Fastify from "fastify";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { bootstrapServer } from "./modules/bootstrap/bootstrap.module";
import { rootRoute } from "./routes/root.route";

const { PORT, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const app = Fastify({
  logger: {
    level: "info",
    redact: {
      censor: "[REDACTED]",
      paths: ['req.headers["x-shutdown-token"]'],
    },
    transport: {
      options: { translateTime: "HH:MM:ss.l" },
      target: "pino-pretty",
    },
  },
});

const bootstrapConfigOptions = {
  port: PORT,
  shutdownToken: SHUTDOWN_TOKEN,
};

const { claimPort, shutdownRouteWithListeners } = bootstrapServer({
  app,
  options: bootstrapConfigOptions,
});

await app.register(rootRoute);
await app.register(...shutdownRouteWithListeners);

await claimPort();
