import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";

import {
  BOOTSTRAP_TIMING,
  SIGNALS_ERROR_MESSAGES,
} from "../constants/bootstrap.constant";
import type { CloseWithGraceReturn } from "../types/bootstrap.type";

const { GRACEFUL_SHUTDOWN_TIMEOUT_MS } = BOOTSTRAP_TIMING;

const setupCloseListeners = (app: FastifyInstance): CloseWithGraceReturn =>
  closeWithGrace(
    { delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS },
    async ({ signal, manual, err: error }) => {
      if (error) {
        app.log.error({ error }, "server closing with error");
      } else if (manual) {
        app.log.info(
          "Another instance started (manual). Shutting down gracefully.",
        );
      } else {
        app.log.info(
          (signal && SIGNALS_ERROR_MESSAGES.get(signal)) ||
            `Received ${signal} signal. Shutting down gracefully.`,
        );
      }

      await app.close();
    },
  );

export const CloseHelper = {
  setupCloseListeners,
};
