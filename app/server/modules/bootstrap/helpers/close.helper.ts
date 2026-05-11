import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";

import { SIGNALS_ERROR_MESSAGES } from "../constants/bootstrap.constant.ts";
import type { CloseWithGraceReturn } from "../types/bootstrap.type.ts";

const setupCloseListeners = (app: FastifyInstance): CloseWithGraceReturn =>
  closeWithGrace(
    { delay: 10_000 },
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
