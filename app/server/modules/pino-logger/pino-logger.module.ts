import type { FastifyBaseLogger } from "fastify";
import type { LoggerExtras } from "pino";
import { pino } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { PinoLoggerHelper } from "./helpers/pino-logger.helper";

const { buildLoggerOptions } = PinoLoggerHelper;

const buildLogger = (appEnv: AppEnv): FastifyBaseLogger & LoggerExtras => {
  return pino(buildLoggerOptions(appEnv));
};

const PinoLoggerModule = Object.freeze({
  buildLogger,
} as const);

export { PinoLoggerModule };
