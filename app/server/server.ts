import Fastify from "fastify";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { inits } from "./inits";
import { BootstrapModule } from "./modules/bootstrap";
import { rootRoute } from "./routes/root.route";

const { PORT, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const { bootstrapServer, shutdownTokenHeader } = BootstrapModule;

const app = Fastify({
  logger: {
    level: "info",
    redact: {
      censor: "[REDACTED]",
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'req.headers["proxy-authorization"]',
        'res.headers["set-cookie"]',
        `req.headers["${shutdownTokenHeader}"]`,
      ],
    },
    transport: {
      options: { translateTime: "HH:MM:ss.l" },
      target: "pino-pretty",
    },
  },
});

try {
  await inits();
  await app.register(rootRoute);
  await bootstrapServer({
    app,
    port: PORT,
    token: SHUTDOWN_TOKEN,
  });
} catch (error) {
  app.log.fatal({ err: error }, "Server bootstrap failed.");
  process.exit(1);
}
