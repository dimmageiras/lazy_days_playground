import type { FastifyPluginCallback } from "fastify";
import type { ServerBuild } from "react-router";

import type { GetLoadContextFunction } from "./load-context.type.ts";

interface CreateRequestHandlerOptions {
  build: ServerBuild | (() => Promise<ServerBuild>);
  getLoadContext?: GetLoadContextFunction;
  mode?: "development" | "production" | "test";
}

type CreateRequestHandlerFactory = (
  options: CreateRequestHandlerOptions
) => FastifyPluginCallback;

export type { CreateRequestHandlerFactory, CreateRequestHandlerOptions };
