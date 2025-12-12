import cookieFastify from "@fastify/cookie";
import expressFastify from "@fastify/express";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

import {
  COOKIE_SECRET,
  IS_DEVELOPMENT,
  MODES,
} from "../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../shared/constants/timing.constant.ts";
import { CSP_DIRECTIVES } from "../constants/csp.constant.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";

const { TYPE_GENERATOR } = MODES;
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

  log.info("✅ Cookie plugin registered");
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

  log.info("✅ Helmet security headers registered");
};

const registerExpress = async (app: FastifyInstance): Promise<void> => {
  try {
    await app.register(expressFastify);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Express compatibility plugin"
    );
    process.exit(1);
  }

  log.info("✅ Express compatibility plugin registered");
};

const initSecurityPlugins = async (
  app: FastifyInstance,
  mode: string
): Promise<void> => {
  if (mode !== TYPE_GENERATOR) {
    registerHelmet(app);
    registerCookie(app);

    if (IS_DEVELOPMENT) {
      registerExpress(app);
    }
  }
};

export const SecurityInit = {
  initSecurityPlugins,
};
