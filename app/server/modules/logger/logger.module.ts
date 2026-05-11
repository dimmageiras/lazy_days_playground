import type { FastifyBaseLogger } from "fastify";
import type { LoggerExtras } from "pino";
import pino from "pino-http";

import { MODE } from "../../../shared/constants/root-env.constant.ts";
import { LOGGER_OPTIONS } from "./constant/logger-module.constant.ts";

const loggerModeOption = Reflect.get(LOGGER_OPTIONS, MODE);
const logger: FastifyBaseLogger & LoggerExtras = pino(loggerModeOption).logger;

export const LoggerModule = { logger };
