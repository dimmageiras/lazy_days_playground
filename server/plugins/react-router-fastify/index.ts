import { createRequestHandler } from "./react-router-fastify.plugin.ts";
import type { GetLoadContextFunction } from "./types/load-context.type.ts";
import type {
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
} from "./types/plugin-factory.type.ts";

export type {
  GetLoadContextFunction,
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
};
export { createRequestHandler };
