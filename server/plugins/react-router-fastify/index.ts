import type { GetLoadContextFunction } from "@server/plugins/react-router-fastify/types/load-context.type";
import type {
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
} from "@server/plugins/react-router-fastify/types/plugin-factory.type";

import { createRequestHandler } from "./react-router-fastify.plugin.ts";

export type {
  GetLoadContextFunction,
  CreateRequestHandlerFactory,
  CreateRequestHandlerOptions,
};
export { createRequestHandler };
