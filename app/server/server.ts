import Fastify from "fastify";

import { DEFAULT_LOG_REDACT_PATHS } from "@shared/constants/logging.constant";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { bootstrapRedactPaths, bootstrapServer } from "./modules/bootstrap";
import { rootRoute } from "./routes/root.route";

const { FATAL_FLUSH_TIMEOUT_MS, LOG_LEVEL, PORT, SHUTDOWN_TOKEN } =
  SERVER_SETTINGS;

const app = Fastify({
  logger: {
    level: LOG_LEVEL,
    redact: {
      censor: "[REDACTED]",
      paths: [...DEFAULT_LOG_REDACT_PATHS, ...bootstrapRedactPaths],
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

  // Pino transports flush on a worker thread; `process.exit` skips that
  // flush, so the fatal line above can vanish without an explicit flush call.
  // `FastifyBaseLogger` doesn't surface Pino's `flush`, so duck-type it.
  const exitAfterFlush = (): never => process.exit(1);
  const flush = Reflect.get(app.log, "flush");

  if (typeof flush === "function") {
    Reflect.apply(flush, app.log, [exitAfterFlush]);
  } else {
    app.log.warn(
      "Logger does not expose a callable `flush`; relying on the timeout deadline to exit.",
    );
  }

  setTimeout(exitAfterFlush, FATAL_FLUSH_TIMEOUT_MS).unref();
}
