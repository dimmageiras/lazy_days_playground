import { createClient as createGelClient } from "gel";

import type { ServerInstance } from "@server/types/instance.type";

import { GEL_AUTH_BASE_URL } from "../../../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";

const { log } = PinoLogHelper;

const registerGelClient = (app: ServerInstance): void => {
  try {
    // Create a single Gel client instance for connection pooling
    const gelClient = createGelClient({
      dsn: GEL_AUTH_BASE_URL,
    });

    // Decorate Fastify instance with the Gel client for reuse across requests
    app.decorate("gelClient", gelClient);
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

const initDatabasePlugins = async (app: ServerInstance): Promise<void> => {
  registerGelClient(app);
};

export const DatabaseInit = {
  initDatabasePlugins,
};
