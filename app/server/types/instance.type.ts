import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyTypeProviderDefault,
} from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";

type APIAppInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  FastifyTypeProviderDefault
>;

export type { APIAppInstance };
