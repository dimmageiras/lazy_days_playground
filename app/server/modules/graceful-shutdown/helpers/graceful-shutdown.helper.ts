import type { APIAppInstance } from "@server/types/instance.type";

import { GRACEFUL_SHUTDOWN_TIMEOUT_MS } from "../constants/graceful-shutdown.constant";
import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

const buildShutdownOptions = (instance: APIAppInstance): ShutdownOptions => {
  return {
    delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS,
    logger: instance.log,
  };
};

const buildShutdownHandler =
  (instance: APIAppInstance): ShutdownHandler =>
  async ({ err: error, signal }: ShutdownContext): Promise<void> => {
    if (error) {
      instance.log.error(
        { error: error.message, stack: error.stack },
        "💥 Shutting down after an unhandled error",
      );
    } else {
      instance.log.info(`Received ${signal}, shutting down…`);
    }

    await instance.close();
  };

const GracefulShutdownHelper = Object.freeze({
  buildShutdownHandler,
  buildShutdownOptions,
} as const);

export { GracefulShutdownHelper };
