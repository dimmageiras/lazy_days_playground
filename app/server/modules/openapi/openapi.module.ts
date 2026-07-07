import {
  fastifyZodOpenApiPlugin,
  fastifyZodOpenApiTransformers,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { API_DOCS_ENDPOINTS } from "@server/constants/endpoints.constant";
import type { AppInstance } from "@server/types/instance.type";

import { OPENAPI_OPTIONS } from "./constants/openapi.constant";

const { API_DOCS } = BASE_URLS;
const { SWAGGER } = API_DOCS_ENDPOINTS;

const DOCS_ROUTE_PREFIX = `${API_DOCS}/${SWAGGER}` as const;

const setupDocs = async (instance: AppInstance): Promise<void> => {
  if (!instance.appEnv.isDevelopment) {
    return;
  }

  const { default: swaggerFastify } = await import("@fastify/swagger");
  const { default: swaggerUIFastify } = await import("@fastify/swagger-ui");

  await instance.register(swaggerFastify, {
    openapi: OPENAPI_OPTIONS,
    ...fastifyZodOpenApiTransformers,
  });

  await instance.register(swaggerUIFastify, {
    routePrefix: DOCS_ROUTE_PREFIX,
  });
};

const setupValidation = async (instance: AppInstance): Promise<void> => {
  instance.setValidatorCompiler(validatorCompiler);
  instance.setSerializerCompiler(serializerCompiler);

  await instance.register(fastifyZodOpenApiPlugin);
};

const OpenApiModule = Object.freeze({
  setupDocs,
  setupValidation,
} as const);

export { OpenApiModule };
