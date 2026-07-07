import type { AppInstance } from "@server/types/instance.type";

type SetupDocsFunction = (instance: AppInstance) => Promise<void>;

type SetupValidationFunction = (instance: AppInstance) => Promise<void>;

export type {
  FastifyZodOpenApiSchema as OpenApiSchema,
  FastifyZodOpenApiTypeProvider as OpenApiTypeProvider,
} from "fastify-zod-openapi";
export type { SetupDocsFunction, SetupValidationFunction };
