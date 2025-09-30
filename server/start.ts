import cookieFastify from "@fastify/cookie";
import swaggerFastify from "@fastify/swagger";
import swaggerUIFastify from "@fastify/swagger-ui";
import { reactRouterFastify } from "@mcansh/remix-fastify/react-router";
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
} from "../shared/constants/base-urls.const.ts";
import {
  COOKIE_SECRET,
  HOST,
  IS_DEVELOPMENT,
  LOG_LEVEL,
  MODE,
  PORT,
} from "../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";
import { TypesHelper } from "./helpers/types.helper.ts";
import { apiHealthRoutes } from "./routes/api-health/index.ts";

const { log } = PinoLogHelper;
const { generateRouteTypes } = TypesHelper;

const app = fastify({
  disableRequestLogging: IS_DEVELOPMENT,
  loggerInstance: log,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

await app.register(fastifyZodOpenApiPlugin);

await app.register(cookieFastify, {
  parseOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: !IS_DEVELOPMENT,
  },
  secret: COOKIE_SECRET,
});
log.info("✅ Cookie plugin registered");

await app.register(async (fastify) => {
  if (IS_DEVELOPMENT) {
    await fastify.register(swaggerFastify, {
      openapi: {
        openapi: "3.1.0",
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

          reply.code(404).send({
            error: `No routes matched location "${request.url}"`,
            statusCode: 404,
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
    log.info("✅ Swagger plugins registered for API routes only");
  }

  await fastify.register(apiHealthRoutes, { prefix: API_HEALTH_BASE_URL });
  // TODO: Fix auth and user routes to use proper FastifyZodOpenApiSchema format
  // await fastify.register(authRoutes, { prefix: AUTH_BASE_URL });
  // await fastify.register(userRoutes, { prefix: USER_BASE_URL });
  log.info("✅ All routes are registered");
});

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

    if (IS_DEVELOPMENT) {
      setTimeout(() => {
        generateRouteTypes({
          cleanOnFirstRun: true,
          routePath: API_HEALTH_BASE_URL,
          serverUrl: address,
        });
      }, 1000);
    }
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    }

    process.exit(1);
  }
};

await startServer();
