import cookieFastify from "@fastify/cookie";
import expressFastify from "@fastify/express";
import helmet from "@fastify/helmet";
import rateLimitFastify from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import swaggerFastify from "@fastify/swagger";
import swaggerUIFastify from "@fastify/swagger-ui";
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
import path from "node:path";
import process from "node:process";
import type { AppLoadContext, ServerBuild } from "react-router";
import { RouterContextProvider } from "react-router";
import type { ViteDevServer } from "vite";
import { createServer } from "vite";

import type { CSPNonceType } from "@shared/types/csp.type";

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
import type { GetLoadContextFunction } from "./plugins/react-router-fastify/index";
import { createRequestHandler } from "./plugins/react-router-fastify/index.ts";
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

    log.info("✅ Helmet security headers registered");
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

  try {
    await app.register(cookieFastify, {
      parseOptions: {
        httpOnly: true,
        sameSite: "strict",
        secure: !IS_DEVELOPMENT,
      },
      secret: COOKIE_SECRET,
    });

    log.info("✅ Cookie plugin registered");
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

  if (IS_DEVELOPMENT) {
    try {
      await app.register(expressFastify);

      log.info("✅ Express compatibility plugin registered");
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
  }
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
        openapi: "3.1.2",
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
        onRequest: (request, response, next) => {
          // Allow all requests under the swagger route prefix (UI, assets, JSON spec)
          if (request.url.startsWith(routePrefix)) {
            next();

            return;
          }

          const referer = request.headers.referer;

          // Block requests not from same origin
          if (!referer?.includes(request.hostname)) {
            response.code(NOT_FOUND).send({
              error: `No routes matched location "${request.url}"`,
              statusCode: NOT_FOUND,
            });

            return;
          }

          next();
        },
        preHandler: (_request, _response, next) => {
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
      transformSpecification: (swaggerObject, request, _response) => {
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
app.setErrorHandler((error, request, response) => {
  const requestId = request.id || "unknown";

  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      method: request.method,
      requestId,
      stack: error instanceof Error ? error.stack : undefined,
      statusCode: response.statusCode || 500,
      url: request.url,
    },
    "💥 Unhandled error in request"
  );

  // For 5xx errors, return sanitized response to hide internal details
  if (response.statusCode >= 500 || !response.statusCode) {
    return response.status(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    });
  }

  // For 4xx errors, pass through the original error
  return response.send(error);
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
          spec: spec,
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

let viteDevServer: ViteDevServer | null = null;

if (IS_DEVELOPMENT) {
  try {
    viteDevServer = await createServer({
      mode: MODE,
      server: { middlewareMode: true },
    });

    app.use(viteDevServer.middlewares);

    log.info("✅ Vite dev server middleware registered");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to create Vite dev server"
    );
    process.exit(1);
  }
}

// Serve static files in production BEFORE registering React Router
if (!IS_DEVELOPMENT) {
  try {
    const buildDir = path.join(process.cwd(), "dist", "client");

    await app.register(fastifyStatic, {
      root: buildDir,
      prefix: "/", // Serve all files from root
      decorateReply: false, // Don't decorate the reply with sendFile
      setHeaders: (res, path) => {
        if (path.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable"); // 1 year for assets
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour for other files
        }
      },
      wildcard: false, // Don't use wildcard matching to avoid conflicts
    });

    log.info("✅ Static file serving registered for production");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register static file serving"
    );

    process.exit(1);
  }
}

try {
  await app.register(
    createRequestHandler({
      build: async () => {
        let build: ServerBuild | null = null;

        try {
          if (IS_DEVELOPMENT) {
            build = await viteDevServer!.ssrLoadModule(
              "virtual:react-router/server-build"
            );
          } else {
            build = (await import(
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore - File exists at runtime after build
              "../../server/index.js"
            )) as ServerBuild;
          }

          return build;
        } catch (error) {
          log.error(
            {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            "💥 Failed to load React Router server build"
          );
          throw error;
        }
      },
      getLoadContext: (
        _request,
        response
      ): ReturnType<GetLoadContextFunction> => {
        const context =
          new RouterContextProvider() as unknown as AppLoadContext;

        // Get CSP nonces from response.locals (bridged from Fastify in onRequest hook)
        const cspNonce: CSPNonceType = response.cspNonce || {
          script: "",
          style: "",
        };

        // Store nonces as a property on context for middleware to access
        context._cspNonce = cspNonce;

        return context as unknown as ReturnType<GetLoadContextFunction>;
      },
      mode: MODE,
    })
  );

  log.info("✅ React Router Fastify plugin registered");
} catch (error) {
  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "💥 Failed to register React Router Fastify plugin"
  );
  process.exit(1);
}

// Register rate limiting AFTER static files and React Router to avoid limiting essential routes
try {
  await app.register(rateLimitFastify, GLOBAL_RATE_LIMIT);

  log.info("✅ Rate limiting plugin registered");
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
