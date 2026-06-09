import type { APIAppInstance } from "@server/types/instance.type";

import { GRACEFUL_SHUTDOWN_TIMEOUT_MS } from "../constants/graceful-shutdown.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

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
          { err: error },
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

const GracefulShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { GracefulShutdownHelper };
