import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { LoggerExtras } from "pino";

/**
 * Custom Fastify instance type with enhanced logging capabilities
 * Combines Fastify's base logger with Pino extras for better type safety
 */
type ServerInstance = FastifyInstance<
  Server<typeof IncomingMessage, typeof ServerResponse>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger & LoggerExtras
>;

export type { ServerInstance };
