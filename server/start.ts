import cookieFastify from "@fastify/cookie";
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
import getPort, { portNumbers } from "get-port";
import process from "node:process";

import { API_DOCS_ENDPOINTS } from "../shared/constants/api.constant.ts";
import {
  API_DOCS_BASE_URL,
  API_HEALTH_BASE_URL,
  AUTH_BASE_URL,
  USER_BASE_URL,
} from "../shared/constants/base-urls.const.ts";
import {
  COOKIE_SECRET,
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  MODES,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { ObjectUtilsHelper } from "../shared/helpers/object-utils.helper.ts";
import { HTTP_STATUS } from "./constants/http-status.constant.ts";
import { GLOBAL_RATE_LIMIT } from "./constants/rate-limit.constant.ts";
import { SWAGGER_ROUTES } from "./constants/swagger-routes.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";
import { TypesHelper } from "./helpers/types.helper.ts";
import { apiHealthRoutes } from "./routes/api-health/index.ts";
import { authRoutes } from "./routes/auth/index.ts";
import { userRoutes } from "./routes/user/index.ts";

const { getObjectValues } = ObjectUtilsHelper;
const { log } = PinoLogHelper;
const { generateContractsForRoute } = TypesHelper;

const { MANY_REQUESTS_ERROR, NOT_FOUND } = HTTP_STATUS;

let fastifyWithSwagger = null as FastifyInstance | null;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifyZodOpenApiPlugin);

if (MODE !== MODES.TYPE_GENERATOR) {
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

  // Add central logging for all 429 errors
  app.addHook("onError", (request, reply, error, done) => {
    if (reply.statusCode === MANY_REQUESTS_ERROR) {
      log.warn(
        {
          error: error.message,
          ip: request.ip,
          route: request.url,
          userAgent: request.headers["user-agent"],
        },
        "Rate limit exceeded (central log)"
      );
    }

    done();
  });
  log.info("✅ Rate limit error hook registered");
}

await app.register(async (fastify: FastifyInstance) => {
  if (MODE === MODES.TYPE_GENERATOR) {
    fastifyWithSwagger = fastify;
  }

  if (MODE !== MODES.PRODUCTION) {
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
        servers: [
          {
            description: "Development server",
            url: `http://localhost:${PORT}`,
          },
        ],
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
          if (request.url.endsWith("/json")) {
            next();

            return;
          }

          const referer = request.headers.referer;

          if (referer && referer.includes(request.hostname)) {
            next();

            return;
          }

          reply.code(NOT_FOUND).send({
            error: `No routes matched location "${request.url}"`,
            statusCode: NOT_FOUND,
          });
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
      transformSpecification: (swaggerObject, _request, _reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });

    if (MODE !== MODES.TYPE_GENERATOR) {
      log.info("✅ Swagger plugins registered for API routes only");
    }
  }

  await fastify.register(apiHealthRoutes, { prefix: API_HEALTH_BASE_URL });
  await fastify.register(authRoutes, { prefix: AUTH_BASE_URL });
  await fastify.register(userRoutes, { prefix: USER_BASE_URL });

  if (MODE !== MODES.TYPE_GENERATOR) {
    log.info("✅ All routes are registered");
  }
});

if (MODE === MODES.TYPE_GENERATOR) {
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
      error instanceof Error
        ? `Failed to generate types: ${error.message}`
        : "Failed to generate types"
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

  try {
    const address = await app.listen({ port: portToUse, host: HOST });

    log.info(`🚀 Server started in ${MODE} mode at ${address}`);
    log.info(`🤖 Log level: "${LOG_LEVEL}"`);

    if (portToUse !== desiredPort) {
      log.warn(
        `! Port ${desiredPort} is not available, using ${portToUse} instead.`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    }

    process.exit(1);
  }
};

await startServer();
