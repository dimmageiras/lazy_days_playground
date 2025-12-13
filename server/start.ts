import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import getPort, { portNumbers } from "get-port";
import process from "node:process";

import {
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { TIMING } from "../shared/constants/timing.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";
import { inits } from "./inits/inits.ts";

const { SECONDS_TEN_IN_MS } = TIMING;

const { log } = PinoLogHelper;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
  requestTimeout: SECONDS_TEN_IN_MS,
}) as unknown as FastifyInstance;

await inits(app);

const startServer = async (): Promise<void> => {
  const desiredPort = Number(PORT);
  const portToUse = await getPort({
    port: portNumbers(desiredPort, desiredPort + 100),
  });

  // Graceful shutdown handler for Gel client connection pool
  const shutdown = async (signal: string): Promise<void> => {
    log.info(`Received ${signal}, closing Gel client connection pool...`);

    try {
      await app.gelClient.close();
      log.info("✅ Gel client connection pool closed gracefully");
    } catch (closeError) {
      log.error(
        {
          error:
            closeError instanceof Error
              ? closeError.message
              : String(closeError),
          stack: closeError instanceof Error ? closeError.stack : undefined,
        },
        "💥 Failed to close Gel client"
      );
    }
  };

  // Register shutdown handlers
  process.on("SIGTERM", () => {
    shutdown("SIGTERM").finally(() => {
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    shutdown("SIGINT").finally(() => {
      process.exit(0);
    });
  });

  try {
    // Ensure the connection pool is ready before starting the server
    await app.gelClient.ensureConnected();
    log.info("✅ Gel database connection pool initialized");

    const address = await app.listen({ port: portToUse, host: HOST });

    log.info(`🚀 Server started in ${MODE} mode at ${address}`);
    log.info(`🤖 Log level: "${LOG_LEVEL}"`);

    if (portToUse !== desiredPort) {
      log.warn(
        `! Port ${desiredPort} is not available, using ${portToUse} instead.`
      );
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to start server"
    );

    // Close the Gel client connection pool on error
    await app.gelClient.close().catch((closeError) => {
      log.error(
        {
          error:
            closeError instanceof Error
              ? closeError.message
              : String(closeError),
          stack: closeError instanceof Error ? closeError.stack : undefined,
        },
        "💥 Failed to close Gel client"
      );
    });

    process.exit(1);
  }
};

await startServer();
