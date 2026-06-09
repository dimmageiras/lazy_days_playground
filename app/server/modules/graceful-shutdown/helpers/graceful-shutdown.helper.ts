import { ErrorHelper } from "@server/helpers/error.helper";
import type { APIAppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";

import {
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  SHUTTING_DOWN,
} from "../constants/graceful-shutdown.constant";
import { SIGNAL_MESSAGES } from "../constants/signals.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

const { normalizeError } = ErrorHelper;
const { getMapValue } = MapHelper;

const buildShutdownOptions = (
  logger: APIAppInstance["log"],
): ShutdownOptions => {
  return {
    delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
    logger,
  };
};

const buildShutdownHandler = (instance: APIAppInstance): ShutdownHandler => {
  return async ({
    err: error,
    manual,
    signal,
  }: ShutdownContext): Promise<void> => {
    switch (true) {
      case Boolean(error): {
        instance.log.error(
          normalizeError(error),
          "💥 Shutting down after an unhandled error",
        );

        break;
      }

      case manual: {
        instance.log.info(`Manual shutdown requested, ${SHUTTING_DOWN}`);

        break;
      }

      default: {
        const fallbackMessage = `Received a shutdown signal, ${SHUTTING_DOWN}`;

        const signalMessage = getMapValue(
          SIGNAL_MESSAGES,
          signal ?? "",
          fallbackMessage,
        );

        instance.log.info(signalMessage);
      }
    }

    await instance.close();
  };
};

const GracefulShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { GracefulShutdownHelper };
