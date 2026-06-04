import type { FastifyBaseLogger } from "fastify";
import type { LoggerExtras } from "pino";

type Logger = FastifyBaseLogger & LoggerExtras;

export type { Logger };
