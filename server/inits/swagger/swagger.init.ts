import swaggerFastify from "@fastify/swagger";
import swaggerUIFastify from "@fastify/swagger-ui";
import { fastifyZodOpenApiTransformers } from "fastify-zod-openapi";

import type { ServerInstance } from "@server/types/instance.type";

import { PinoLogHelper } from "../../../server/helpers/pino-log.helper.ts";
import { API_DOCS_ENDPOINTS } from "../../../shared/constants/api.constant.ts";
import { API_DOCS_BASE_URL } from "../../../shared/constants/base-urls.constant.ts";
import {
  MODE,
  MODES,
  PORT,
} from "../../../shared/constants/root-env.constant.ts";
import { HTTP_STATUS } from "../../constants/http-status.constant.ts";

const { NOT_FOUND } = HTTP_STATUS;
const { PRODUCTION, TYPE_GENERATOR } = MODES;

const { log } = PinoLogHelper;

const registerSwagger = async (
  app: ServerInstance,
  swaggerInstanceRef: { current: ServerInstance | null },
  initRoutesPlugins: (app: ServerInstance) => Promise<void>
): Promise<void> => {
  try {
    await app.register(async (fastify: ServerInstance) => {
      if (MODE === TYPE_GENERATOR) {
        swaggerInstanceRef.current = fastify;
      }

      if (MODE !== PRODUCTION) {
        await fastify.register(swaggerFastify, {
          openapi: {
            info: {
              contact: {
                name: "API Support",
              },
              description:
                "API documentation for Lazy Days Playground application",
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
            const socket = request.socket;
            const isEncrypted =
              "encrypted" in socket && socket.encrypted === true;
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
      }

      await initRoutesPlugins(fastify);
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to register Swagger plugins"
    );
    process.exit(1);
  }
};

const initSwaggerPlugins = async (
  app: ServerInstance,
  swaggerInstanceRef: { current: ServerInstance | null },
  initRoutesPlugins: (app: ServerInstance) => Promise<void>
): Promise<void> => {
  await registerSwagger(app, swaggerInstanceRef, initRoutesPlugins);
};

export const SwaggerInit = {
  initSwaggerPlugins,
};
