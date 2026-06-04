import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyTypeProviderDefault,
} from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { LoggerExtras } from "pino";

type APIAppInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger & LoggerExtras,
  FastifyTypeProviderDefault
>;

export type { APIAppInstance };
