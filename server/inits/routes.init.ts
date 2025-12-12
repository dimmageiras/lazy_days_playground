import type { FastifyInstance } from "fastify";

import {
  API_HEALTH_BASE_URL,
  API_REPORTS_BASE_URL,
  AUTH_BASE_URL,
  USER_BASE_URL,
} from "../../shared/constants/base-urls.constant.ts";
import { MODES } from "../../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { apiHealthRoutes } from "../routes/api/health/index.ts";
import { reportsRoute } from "../routes/api/reports/index.ts";
import { authRoutes } from "../routes/auth/index.ts";
import { userRoutes } from "../routes/user/index.ts";

const { TYPE_GENERATOR } = MODES;

const { log } = PinoLogHelper;

const registerApiHealthRoutes = async (app: FastifyInstance): Promise<void> => {
  await app.register(apiHealthRoutes, { prefix: API_HEALTH_BASE_URL });
};

const registerReportsRoutes = async (app: FastifyInstance): Promise<void> => {
  await app.register(reportsRoute, { prefix: API_REPORTS_BASE_URL });
};

const registerAuthRoutes = async (app: FastifyInstance): Promise<void> => {
  await app.register(authRoutes, { prefix: AUTH_BASE_URL });
};

const registerUserRoutes = async (app: FastifyInstance): Promise<void> => {
  await app.register(userRoutes, { prefix: USER_BASE_URL });
};

const initRoutes = async (
  app: FastifyInstance,
  mode: string
): Promise<void> => {
  try {
    registerApiHealthRoutes(app);
    registerReportsRoutes(app);
    registerAuthRoutes(app);
    registerUserRoutes(app);

    if (mode !== TYPE_GENERATOR) {
      log.info("✅ All routes are registered");
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register routes"
    );
    process.exit(1);
  }
};

export const RoutesInit = {
  initRoutes,
};
