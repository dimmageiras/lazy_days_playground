import type { FastifyInstance } from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import type { Logger } from "@server/modules/logger";
import type { OpenApiTypeProvider } from "@server/modules/openapi";

type AppInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  Logger,
  OpenApiTypeProvider
>;

export type { AppInstance };
