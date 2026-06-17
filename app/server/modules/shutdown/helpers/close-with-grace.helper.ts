import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";

import {
  SHUTDOWN_PHRASES,
  SIGNAL_MESSAGES,
} from "../constants/messages.constant";
import { TIMING_IN_MS } from "../constants/timing.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/shutdown.type";

const { SHUTTING_DOWN } = SHUTDOWN_PHRASES;
const { SHUTDOWN_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;
const { getMapValue } = MapHelper;

const buildShutdownHandler = (instance: AppInstance): ShutdownHandler => {
  return async ({
    err: error,
    manual,
    signal,
  }: ShutdownContext): Promise<void> => {
    switch (true) {
      case Boolean(error): {
        instance.log.fatal(
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

const buildShutdownOptions = (logger: AppInstance["log"]): ShutdownOptions => {
  return {
    delay: SHUTDOWN_TIMEOUT,
    logger,
  };
};

const CloseWithGraceHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { CloseWithGraceHelper };
