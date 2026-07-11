import { Set } from "immutable";
import type { LoggerOptions } from "pino";

const LOG_LEVEL = Set([
  "debug",
  "error",
  "fatal",
  "info",
  "silent",
  "trace",
  "warn",
] as const satisfies readonly NonNullable<LoggerOptions["level"]>[]);

export { LOG_LEVEL };
