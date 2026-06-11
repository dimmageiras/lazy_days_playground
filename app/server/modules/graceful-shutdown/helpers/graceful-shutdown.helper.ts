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

const buildShutdownHandler =
  (instance: AppInstance): ShutdownHandler =>
  async ({ err: error, signal }: ShutdownContext): Promise<void> => {
    if (error) {
      instance.log.error(
        normalizeError(error),
        "💥 Shutting down after an unhandled error",
      );
    } else {
      instance.log.info(`Received ${signal}, shutting down…`);
    }

    await instance.close();
  };

const buildShutdownOptions = (instance: AppInstance): ShutdownOptions => {
  return {
    delay: SHUTDOWN_TIMEOUT,
    logger: instance.log,
  };
};

const GracefulShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { GracefulShutdownHelper };
