import { ErrorHelper } from "@server/helpers/error.helper";
import type { APIAppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";

import { MESSAGES, SIGNAL_MESSAGES } from "../constants/messages.constant";
import { TIMING_IN_MS } from "../constants/timing.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

const { SHUTTING_DOWN } = MESSAGES;
const { GRACEFUL_SHUTDOWN_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;
const { getMapValue } = MapHelper;

const buildShutdownOptions = (
  logger: APIAppInstance["log"],
): ShutdownOptions => {
  return {
    delay: GRACEFUL_SHUTDOWN_TIMEOUT,
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
