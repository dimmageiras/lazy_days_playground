import type { LoggerOptions } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/logger.constant";

const buildFallbackLoggerOptions = (): LoggerOptions => {
  return {
    level: "info",
  };
};

const buildLoggerOptions = (appEnv: AppEnv): LoggerOptions => {
  const { isDevelopment, logLevel, serviceName } = appEnv;

  return {
    base: { service: serviceName },
    level: logLevel,
    ...(isDevelopment ? { transport: PRETTY_TRANSPORT } : {}),
  };
};

const LoggerHelper = Object.freeze({
  buildFallbackLoggerOptions,
  buildLoggerOptions,
} as const);

export { LoggerHelper };
