import type { LoggerOptions } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/pino-logger.constant";

const buildLoggerOptions = (appEnv: AppEnv): LoggerOptions => {
  const { isDevelopment, logLevel, serviceName } = appEnv;

  return {
    base: { service: serviceName },
    level: logLevel,
    ...(isDevelopment ? { transport: PRETTY_TRANSPORT } : {}),
  };
};

const PinoLoggerHelper = Object.freeze({
  buildLoggerOptions,
} as const);

export { PinoLoggerHelper };
