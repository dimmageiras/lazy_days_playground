import cookieFastify from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimitFastify from "@fastify/rate-limit";
import swaggerFastify from "@fastify/swagger";
import swaggerUIFastify from "@fastify/swagger-ui";
import { reactRouterFastify } from "@mcansh/remix-fastify/react-router";
import type { FastifyInstance } from "fastify";
import fastify from "fastify";
import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";
import { createClient as createGelClient } from "gel";
import getPort, { portNumbers } from "get-port";
import process from "node:process";

import { API_DOCS_ENDPOINTS } from "../shared/constants/api.constant.ts";
import {
  API_DOCS_BASE_URL,
  API_HEALTH_BASE_URL,
  API_REPORTS_BASE_URL,
  AUTH_BASE_URL,
  USER_BASE_URL,
} from "../shared/constants/base-urls.constant.ts";
import {
  COOKIE_SECRET,
  GEL_AUTH_BASE_URL,
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  MODES,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { TIMING } from "../shared/constants/timing.constant.ts";
import { ObjectUtilsHelper } from "../shared/helpers/object-utils.helper.ts";
import { CSP_DIRECTIVES } from "./constants/csp.constant.ts";
import { HTTP_STATUS } from "./constants/http-status.constant.ts";
import { GLOBAL_RATE_LIMIT } from "./constants/rate-limit.constant.ts";
import { SWAGGER_ROUTES } from "./constants/swagger-routes.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";
import { TypesHelper } from "./helpers/types.helper.ts";
import { apiHealthRoutes } from "./routes/api/health/index.ts";
import { reportsRoute } from "./routes/api/reports/index.ts";
import { authRoutes } from "./routes/auth/index.ts";
import { userRoutes } from "./routes/user/index.ts";

const { NOT_FOUND } = HTTP_STATUS;
const { PRODUCTION, TYPE_GENERATOR } = MODES;
const { SECONDS_TEN_IN_MS, YEARS_ONE_IN_S } = TIMING;

const { getObjectValues } = ObjectUtilsHelper;
const { log } = PinoLogHelper;
const { generateContractsForRoute } = TypesHelper;

let fastifyWithSwagger = null as FastifyInstance | null;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
  requestTimeout: SECONDS_TEN_IN_MS,
});

// Create a single Gel client instance for connection pooling
const gelClient = createGelClient({
  dsn: GEL_AUTH_BASE_URL,
});

// Decorate Fastify instance with the Gel client for reuse across requests
app.decorate("gelClient", gelClient);

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifyZodOpenApiPlugin);

if (MODE !== TYPE_GENERATOR) {
  await app.register(helmet, {
    contentSecurityPolicy: IS_DEVELOPMENT
      ? false
      : { directives: CSP_DIRECTIVES },
    // Disabled in development to allow React DevTools to work properly
    // DevTools requires cross-origin embedding which COEP blocks
    crossOriginEmbedderPolicy: !IS_DEVELOPMENT,
    hsts: {
      includeSubDomains: true,
      maxAge: YEARS_ONE_IN_S,
      preload: true,
    },
  });
  log.info("✅ Helmet security headers registered");

  await app.register(cookieFastify, {
    parseOptions: {
      httpOnly: true,
      sameSite: "strict",
      secure: !IS_DEVELOPMENT,
    },
    secret: COOKIE_SECRET,
  });
  log.info("✅ Cookie plugin registered");

  await app.register(rateLimitFastify, GLOBAL_RATE_LIMIT);
  log.info("✅ Rate limiting plugin registered");
}

await app.register(async (fastify: FastifyInstance) => {
  if (MODE === TYPE_GENERATOR) {
    fastifyWithSwagger = fastify;
  }

  if (MODE !== PRODUCTION) {
    await fastify.register(swaggerFastify, {
      openapi: {
        info: {
          contact: {
            name: "API Support",
          },
          description: "API documentation for Lazy Days Playground application",
          license: {
            name: "MIT",
          },
          title: "Lazy Days Playground API",
          version: "1.0.0",
        },
        openapi: "3.1.0",
      },
      ...fastifyZodOpenApiTransformers,
    });

    const { SWAGGER } = API_DOCS_ENDPOINTS;
    const routePrefix = `/${API_DOCS_BASE_URL}/${SWAGGER}` as const;

    await fastify.register(swaggerUIFastify, {
      routePrefix,
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      uiHooks: {
        onRequest: (request, reply, next) => {
          // Allow all requests under the swagger route prefix (UI, assets, JSON spec)
          if (request.url.startsWith(routePrefix)) {
            next();

            return;
          }

          const referer = request.headers.referer;

          // Block requests not from same origin
          if (!referer || !referer.includes(request.hostname)) {
            reply.code(NOT_FOUND).send({
              error: `No routes matched location "${request.url}"`,
              statusCode: NOT_FOUND,
            });

            return;
          }

          next();
        },
        preHandler: (_request, _reply, next) => {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => {
        return header.replace(
          "style-src 'self' https:",
          "style-src 'self' https: 'unsafe-inline'"
        );
      },
      transformSpecification: (swaggerObject, request, _reply) => {
        const host = request.headers.host || `localhost:${PORT}`;
        // Check X-Forwarded-Proto header first for proxied environments (e.g., behind load balancer, reverse proxy)
        // This header is set by proxies to indicate the original protocol used by the client
        const forwardedProto = request.headers["x-forwarded-proto"];
        // Check if socket is encrypted (TLS) by checking for encrypted property
        const socket = request.socket as { encrypted?: boolean } | null;
        const isEncrypted = socket?.encrypted === true;
        const protocol =
          forwardedProto ||
          request.protocol ||
          (isEncrypted ? "https" : "http");

        return {
          ...swaggerObject,
          servers: [
            {
              url: `${protocol}://${host}`,
              description: "Current server",
            },
          ],
        };
      },
      transformSpecificationClone: true,
    });

    if (MODE !== TYPE_GENERATOR) {
      log.info("✅ Swagger plugins registered for API routes only");
    }
  }

  await fastify.register(apiHealthRoutes, { prefix: API_HEALTH_BASE_URL });
  await fastify.register(reportsRoute, { prefix: API_REPORTS_BASE_URL });
  await fastify.register(authRoutes, { prefix: AUTH_BASE_URL });
  await fastify.register(userRoutes, { prefix: USER_BASE_URL });

  if (MODE !== TYPE_GENERATOR) {
    log.info("✅ All routes are registered");
  }
});

// Global error handler - catches unhandled errors across all routes
app.setErrorHandler((error, request, reply) => {
  const requestId = request.id || "unknown";

  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      method: request.method,
      requestId,
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: reply.statusCode || 500,
      url: request.url,
    },
    "💥 Unhandled error in request"
  );

  // For 5xx errors, return sanitized response to hide internal details
  if (reply.statusCode >= 500 || !reply.statusCode) {
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    });
  }

  // For 4xx errors, pass through the original error
  return reply.send(error);
});

if (MODE === TYPE_GENERATOR) {
  try {
    await app.ready();

    if (!fastifyWithSwagger) {
      throw new Error("Fastify instance with swagger not available");
    }

    const spec = fastifyWithSwagger.swagger();
    const routes: (typeof SWAGGER_ROUTES)[keyof typeof SWAGGER_ROUTES][] =
      getObjectValues(SWAGGER_ROUTES);

    for (let index = 0; index < routes.length; index++) {
      const cleanOnFirstRun = index === 0;
      const routePath = Reflect.get(routes, index);

      if ("openapi" in spec) {
        await generateContractsForRoute({
          cleanOnFirstRun,
          routePath,
          spec,
          isLastRoute: index === routes.length - 1,
        });
      }
    }

    process.exit(0);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to generate types"
    );
    process.exit(1);
  }
}

await app.register(reactRouterFastify, {
  buildDirectory: "dist",
  serverBuildFile: "index.js",
  viteOptions: {
    mode: MODE,
  },
});
log.info("✅ React Router SSR plugin registered");

const startServer = async (): Promise<void> => {
  const desiredPort = Number(PORT);
  const portToUse = await getPort({
    port: portNumbers(desiredPort, desiredPort + 100),
  });

  // Graceful shutdown handler for Gel client connection pool
  const shutdown = async (signal: string): Promise<void> => {
    log.info(`Received ${signal}, closing Gel client connection pool...`);

    try {
      await gelClient.close();
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
    await gelClient.ensureConnected();
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
    await gelClient.close().catch((closeError) => {
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
