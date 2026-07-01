import type { LoggerOptions } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/logger.constant";

const buildFallbackLoggerOptions = (): LoggerOptions => {
  return {
    level: "info",
  };
};

const buildLoggerOptions = (
  appEnv: AppEnv,
  redactPaths: ReadonlyArray<string>,
): LoggerOptions => {
  const { isDevelopment, logLevel, serviceName } = appEnv;

  return {
    base: { service: serviceName },
    level: logLevel,
    ...(redactPaths.length > 0 && {
      redact: {
        censor: "[REDACTED]",
        paths: [...redactPaths],
      },
    }),
    ...(isDevelopment && { transport: PRETTY_TRANSPORT }),
  };
};

const LoggerHelper = Object.freeze({
  buildFallbackLoggerOptions,
  buildLoggerOptions,
} as const);

export { LoggerHelper };
