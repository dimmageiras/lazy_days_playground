import cookieFastify from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimitFastify from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import {
  COOKIE_SECRET,
  IS_DEVELOPMENT,
} from "../../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../../shared/constants/timing.constant.ts";
import { CSP_DIRECTIVES } from "../../constants/csp.constant.ts";
import { GLOBAL_RATE_LIMIT } from "../../constants/rate-limit.constant.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";

const { YEARS_ONE_IN_S } = TIMING;

const { log } = PinoLogHelper;

const registerCookie = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(cookieFastify, {
      parseOptions: {
        httpOnly: true,
        sameSite: "strict",
        secure: !IS_DEVELOPMENT,
      },
      secret: COOKIE_SECRET,
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Cookie plugin"
    );
    process.exit(1);
  }
};

const registerHelmet = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(helmet, {
      contentSecurityPolicy: IS_DEVELOPMENT
        ? false
        : { directives: CSP_DIRECTIVES, useDefaults: false },
      crossOriginEmbedderPolicy: !IS_DEVELOPMENT,
      enableCSPNonces: !IS_DEVELOPMENT,
      hsts: {
        includeSubDomains: true,
        maxAge: YEARS_ONE_IN_S,
        preload: true,
      },
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Helmet security plugin"
    );
    process.exit(1);
  }
};

const registerRateLimit = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(rateLimitFastify, GLOBAL_RATE_LIMIT);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Rate Limit plugin"
    );
    process.exit(1);
  }
};

const initSecurityPlugins = async (app: FastifyInstance): Promise<void> => {
  await registerRateLimit(app);
  await registerCookie(app);
  await registerHelmet(app);
};

export const SecurityInit = {
  initSecurityPlugins,
};
