import { pino } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { LoggerHelper } from "./helpers/logger.helper";
import type { Logger } from "./types/logger.type";

const { buildLoggerOptions } = LoggerHelper;

const buildLogger = (appEnv: AppEnv): Logger => {
  return pino(buildLoggerOptions(appEnv));
};

const LoggerModule = Object.freeze({
  buildLogger,
} as const);

export { LoggerModule };
