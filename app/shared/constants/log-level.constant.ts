import { Set } from "immutable";
import type { LoggerOptions } from "pino";

const LOG_LEVEL: Set<NonNullable<LoggerOptions["level"]>> = Set([
  "debug",
  "error",
  "fatal",
  "info",
  "silent",
  "trace",
  "warn",
]);

export { LOG_LEVEL };
