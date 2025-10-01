import type { IncomingMessage, ServerResponse } from "node:http";
import type { Options } from "pino-http";
import pino from "pino-http";

import { LOG_LEVEL, MODE } from "../../shared/constants/root-env.constant.ts";

const loggerOptions: Record<
  typeof MODE,
  Options<IncomingMessage, ServerResponse<IncomingMessage>, never>
> = {
  development: {
    level: LOG_LEVEL ?? "info",
    autoLogging: false,
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  },
  production: {
    level: LOG_LEVEL ?? "info",
  },
  type_generator: {
    level: LOG_LEVEL ?? "info",
    autoLogging: false,
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  },
};

const opts = Reflect.get(loggerOptions, MODE);
const log = pino(opts).logger;

export const PinoLogHelper = { log };
