import cookieFastify from "@fastify/cookie";
import csrfProtection from "@fastify/csrf-protection";
import helmet from "@fastify/helmet";
import rateLimitFastify from "@fastify/rate-limit";
import type { Method } from "axios";

import type { ServerInstance } from "@server/types/instance.type";

import { BASE_COOKIE_CONFIG } from "../../../shared/constants/cookie.constant.ts";
import {
  COOKIE_SECRET,
  IS_DEVELOPMENT,
} from "../../../shared/constants/root-env.constant.ts";
import { TIMING } from "../../../shared/constants/timing.constant.ts";
import { ApiHelper } from "../../../shared/helpers/api.helper.ts";
import { StringUtilsHelper } from "../../../shared/helpers/string-utils.helper.ts";
import { TypeHelper } from "../../../shared/helpers/type.helper.ts";
import { csrfTokenMismatchErrorSchema } from "../../../shared/schemas/api-security/csrf-token-route.schema.ts";
import { CSP_DIRECTIVES } from "../../constants/csp.constant.ts";
import {
  CSRF_EXCLUDED_PATHS,
  CSRF_HEADER,
} from "../../constants/csrf.constant.ts";
import { HTTP_STATUS } from "../../constants/http-status.constant.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { RoutesHelper } from "../../helpers/routes.helper.ts";

const { CSRF_TOKEN_MISMATCH, FORBIDDEN } = HTTP_STATUS;
const { MINUTES_FIFTEEN_IN_S, YEARS_ONE_IN_S } = TIMING;

const { getCurrentISOTimestamp } = RoutesHelper;
const { isMutatingMethod } = ApiHelper;
const { log } = PinoLogHelper;
const { isString, toUpperCase } = StringUtilsHelper;
const { castAsType } = TypeHelper;

const registerCookie = async (app: ServerInstance): Promise<void> => {
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
      "💥 Failed to register Cookie plugin",
    );
    process.exit(1);
  }
};

const registerCsrf = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(csrfProtection, {
      cookieOpts: {
        ...BASE_COOKIE_CONFIG,
        maxAge: MINUTES_FIFTEEN_IN_S,
      },
      getToken: (request) => {
        const token = Reflect.get(request.headers, CSRF_HEADER);

        return (isString(token) && token) || "";
      },
    });

    // Override CSRF plugin's 403: set status 419, reason phrase, and payload (statusCode + error).
    // The plugin calls reply.send(error) directly, so an onSend hook is needed to intercept the response.
    app.addHook("onSend", (_request, reply, payload, done) => {
      if (reply.statusCode !== FORBIDDEN) {
        done(null, payload);

        return;
      }

      reply.code(CSRF_TOKEN_MISMATCH);
      reply.raw.statusMessage = "CSRF Token Mismatch";

      const body = csrfTokenMismatchErrorSchema.parse({
        details: "Missing or invalid x-csrf-token header",
        error: "CSRF Token Mismatch",
        timestamp: getCurrentISOTimestamp(),
      });

      done(null, JSON.stringify(body));
    });

    // CSRF validation for all state-changing requests except explicitly excluded paths
    app.addHook("onRequest", (request, reply, done) => {
      const method = castAsType<Method>(request.method);

      if (!isMutatingMethod(toUpperCase(method))) {
        done();

        return;
      }

      const urlPath = request.url.split("?")[0] ?? "";

      if (CSRF_EXCLUDED_PATHS.has(urlPath)) {
        done();

        return;
      }

      app.csrfProtection(request, reply, done);
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register CSRF protection plugin",
    );
    process.exit(1);
  }
};

const registerHelmet = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(helmet, {
      contentSecurityPolicy: IS_DEVELOPMENT
        ? false
        : { directives: CSP_DIRECTIVES, useDefaults: false },
      crossOriginEmbedderPolicy: !IS_DEVELOPMENT,
      enableCSPNonces: !IS_DEVELOPMENT,
      global: true,
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
      "💥 Failed to register Helmet security plugin",
    );
    process.exit(1);
  }
};

const registerRateLimit = async (app: ServerInstance): Promise<void> => {
  try {
    await app.register(rateLimitFastify);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Rate Limit plugin",
    );
    process.exit(1);
  }
};

const initSecurityPlugins = async (app: ServerInstance): Promise<void> => {
  await registerRateLimit(app);
  await registerCookie(app);
  await registerCsrf(app);
  await registerHelmet(app);
};

export const SecurityInit = {
  initSecurityPlugins,
};
