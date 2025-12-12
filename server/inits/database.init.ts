import type { FastifyInstance } from "fastify";
import { createClient as createGelClient } from "gel";

import { GEL_AUTH_BASE_URL } from "../../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";

const { log } = PinoLogHelper;

const registerGelClient = (app: FastifyInstance): void => {
  // Create a single Gel client instance for connection pooling
  const gelClient = createGelClient({
    dsn: GEL_AUTH_BASE_URL,
  });

  // Decorate Fastify instance with the Gel client for reuse across requests
  app.decorate("gelClient", gelClient);

  log.info("✅ Gel database client registered");
};

const initDatabasePlugins = async (
  app: FastifyInstance,
  _mode: string
): Promise<void> => {
  try {
    registerGelClient(app);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Gel database client"
    );
    process.exit(1);
  }
};

export const DatabaseInit = {
  initDatabasePlugins,
};
