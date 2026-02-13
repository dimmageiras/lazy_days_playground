import type { GetLoadContextFunction } from "@server/plugins/react-router-fastify/types/load-context.type";

import { createRequestHandler } from "./react-router-fastify.plugin.ts";

export type { GetLoadContextFunction };
export { createRequestHandler };
