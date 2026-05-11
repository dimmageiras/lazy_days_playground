import type { IncomingMessage, ServerResponse } from "node:http";
import type { Options } from "pino-http";

import type { MODE } from "@shared/constants/root-env.constant";

import { LOG_LEVEL } from "../../../constants/server-env.constant";

type ModeOptions = Options<
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  never
>;

const MODE_OPTIONS: ModeOptions = Object.freeze({
  level: LOG_LEVEL,
  autoLogging: false,
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
} as const);

const LOGGER_OPTIONS: Record<typeof MODE, ModeOptions> = {
  development: MODE_OPTIONS,
  production: {
    level: LOG_LEVEL,
  },
  type_generator: MODE_OPTIONS,
};

export { LOGGER_OPTIONS };
