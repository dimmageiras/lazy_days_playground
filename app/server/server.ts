import Fastify from "fastify";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { bootstrapServer } from "./modules/bootstrap/bootstrap.module";
import { rootRoute } from "./routes/root.route";
import { inits } from "./inits";

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

const { claimPort, shutdownRoute, shutdownRouteOptions } = bootstrapServer({
  app,
  options: { port: PORT, token: SHUTDOWN_TOKEN },
});

try {
  await app.register(rootRoute);
  await inits(app);
  await claimPort();
} catch (error) {
  app.log.fatal({ err: error }, "Server bootstrap failed.");
  process.exit(1);
}
