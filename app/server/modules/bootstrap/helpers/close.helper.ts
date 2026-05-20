import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";

import { SIGNALS_ERROR_MESSAGES, TIMING } from "../constants";
import type { CloseWithGraceReturn } from "../types";

const { GRACEFUL_SHUTDOWN_TIMEOUT_MS } = TIMING;

const setupCloseListeners = async (
  app: FastifyInstance,
): Promise<CloseWithGraceReturn> => {
  const prior = globalThis.__priorInstance;

  if (prior) {
    globalThis.__priorInstance = undefined;
    prior.handle.uninstall();

    try {
      await prior.app.close();
    } catch (error) {
      app.log.warn(
        { err: error },
        "Prior instance close failed during re-eval cleanup; continuing.",
      );
    }
  }

  const closeListeners = closeWithGrace(
    { delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS, logger: app.log },
    async ({ signal, manual, err: error }) => {
      if (error) {
        app.log.error({ err: error }, "server closing with error");
      } else if (manual) {
        app.log.info(
          "Another instance started (manual). Shutting down gracefully.",
        );
      } else {
        app.log.info(
          (signal && SIGNALS_ERROR_MESSAGES.get(signal)) ??
            "Shutdown signal received. Shutting down gracefully.",
        );
      }

      await app.close();
    },
  );

  globalThis.__priorInstance = { app, handle: closeListeners };

  return closeListeners;
};

const CloseHelper = Object.freeze({
  setupCloseListeners,
} as const);

export { CloseHelper };
