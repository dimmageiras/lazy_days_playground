import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { TIMING_IN_MS } from "../constants/timing.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

const { SHUTDOWN_TIMEOUT } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;

const buildShutdownHandler = (instance: AppInstance): ShutdownHandler => {
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
        instance.log.info("Manual shutdown requested, shutting down…");

        break;
      }

      default: {
        instance.log.info(`Received ${signal}, shutting down…`);
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

const GracefulShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { GracefulShutdownHelper };
