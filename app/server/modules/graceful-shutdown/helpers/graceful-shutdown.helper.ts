import type { APIAppInstance } from "@server/types/instance.type";

import type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
} from "../types/graceful-shutdown.type";

const buildShutdownOptions = (instance: APIAppInstance): ShutdownOptions => {
  return {
    delay: instance.appEnv.fatalFlushTimeoutMs,
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
