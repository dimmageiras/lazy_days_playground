import type { FastifyInstance, FastifyTypeProviderDefault } from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

import type { Logger } from "../modules/logger";

type APIAppInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  Logger,
  FastifyTypeProviderDefault
>;

export type { APIAppInstance };
