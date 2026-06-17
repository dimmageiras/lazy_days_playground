import { destination, pino } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { LoggerHelper } from "./helpers/logger.helper";
import type { Logger } from "./types/logger.type";

const { buildFallbackLoggerOptions, buildLoggerOptions } = LoggerHelper;

const buildFallbackLogger = (): Logger => {
  return pino(buildFallbackLoggerOptions(), destination({ sync: true }));
};

const buildLogger = (
  appEnv: AppEnv,
  redactPaths: ReadonlyArray<string> = [],
): Logger => {
  return pino(buildLoggerOptions(appEnv, redactPaths));
};

const LoggerModule = Object.freeze({
  buildFallbackLogger,
  buildLogger,
} as const);

export { LoggerModule };
