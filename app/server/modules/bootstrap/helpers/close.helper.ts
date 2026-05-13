import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";

import {
  BOOTSTRAP_TIMING,
  SIGNALS_ERROR_MESSAGES,
} from "../constants/bootstrap.constant";
import type { CloseWithGraceReturn } from "../types/bootstrap.type";

const { GRACEFUL_SHUTDOWN_TIMEOUT_MS } = BOOTSTRAP_TIMING;

/**
 * Installs close-with-grace listeners for `app` and, in vite-node `--watch`
 * re-evals, retires the prior in-process instance first.
 *
 * Same-process retirement closes the prior `app` directly and only calls
 * `.uninstall()` on the prior handle. We must NOT call `handle.close()` here:
 * `close-with-grace` ends its run with `process.exit(0)`, which in a shared
 * process kills the freshly-bootstrapping new instance along with the old.
 * The cross-process cooperative-shutdown POST path (separate Node processes,
 * separate `globalThis`) continues to use `handle.close()` and benefits from
 * that exit.
 */
const setupCloseListeners = async (
  app: FastifyInstance,
): Promise<CloseWithGraceReturn> => {
  const prior = globalThis.__priorInstance;

  if (prior) {
    prior.handle.uninstall();
    await prior.app.close();
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
