import Fastify from "fastify";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { bootstrapServer } from "./modules/bootstrap/bootstrap.module";
import { BOOTSTRAP_PROTOCOL } from "./modules/bootstrap/constants/bootstrap.constant";
import { rootRoute } from "./routes/root.route";

const { PORT, SHUTDOWN_TOKEN } = SERVER_SETTINGS;
const { SHUTDOWN_TOKEN_HEADER } = BOOTSTRAP_PROTOCOL;

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
        `req.headers["${SHUTDOWN_TOKEN_HEADER}"]`,
      ],
    },
    transport: {
      options: { translateTime: "HH:MM:ss.l" },
      target: "pino-pretty",
    },
  },
});

try {
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
