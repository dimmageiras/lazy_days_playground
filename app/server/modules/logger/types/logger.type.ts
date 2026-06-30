import type { FastifyBaseLogger } from "fastify";
import type { LoggerExtras } from "pino";

import type { AppEnv } from "@shared/types/app-env.type";

type BuildFallbackLoggerFunction = () => Logger;

type BuildLoggerFunction = (
  appEnv: AppEnv,
  redactPaths?: ReadonlyArray<string>,
) => Logger;

type Logger = FastifyBaseLogger & LoggerExtras;

export type { BuildFallbackLoggerFunction, BuildLoggerFunction, Logger };
