import type { ServerInstance } from "@server/types/instance.type";

import {
  API_HEALTH_BASE_URL,
  API_REPORTS_BASE_URL,
  AUTH_BASE_URL,
  USER_BASE_URL,
} from "../../../shared/constants/base-urls.constant.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { apiHealthRoutes } from "../../routes/api/health/index.ts";
import { reportsRoute } from "../../routes/api/reports/index.ts";
import { authRoutes } from "../../routes/auth/index.ts";
import { userRoutes } from "../../routes/user/index.ts";

const { log } = PinoLogHelper;

const registerApiHealthRoutes = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(apiHealthRoutes, { prefix: API_HEALTH_BASE_URL });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register API health routes"
    );
    process.exit(1);
  }
};

const registerReportsRoutes = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(reportsRoute, { prefix: API_REPORTS_BASE_URL });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register reports routes"
    );
    process.exit(1);
  }
};

const registerAuthRoutes = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(authRoutes, { prefix: AUTH_BASE_URL });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register auth routes"
    );
    process.exit(1);
  }
};

const registerUserRoutes = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(userRoutes, { prefix: USER_BASE_URL });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register user routes"
    );
    process.exit(1);
  }
};

const initRoutesPlugins = async (app: ServerInstance): Promise<void> => {
  await registerApiHealthRoutes(app);
  await registerReportsRoutes(app);
  await registerAuthRoutes(app);
  await registerUserRoutes(app);
};

export const RoutesInit = {
  initRoutesPlugins,
};
