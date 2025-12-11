import { createRequestHandler } from "./react-router-fastify.plugin.ts";
import type { GetLoadContextFunction } from "./types/load-context.type";
import type {
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
} from "./types/plugin-factory.type";

export type {
  GetLoadContextFunction,
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
};
export { createRequestHandler };
