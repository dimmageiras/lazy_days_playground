import closeWithGrace from "close-with-grace";
import type { FastifyInstance } from "fastify";

import { TIMING } from "../constants";
import type { CloseWithGraceReturn } from "../types";
import { BootstrapLifecycleHelper } from "./bootstrap-lifecycle.helper";

const { GRACEFUL_SHUTDOWN_TIMEOUT_MS } = TIMING;

const { createBootstrapLifecycleBus } = BootstrapLifecycleHelper;

/**
 * Orchestrates instance lifecycle around `closeWithGrace`:
 *   1. Emit `retire` (HMR path) so the prior instance, if any, closes
 *      before the new handle attaches process-level listeners.
 *   2. Install the new `closeWithGrace` handle. Its async callback
 *      forwards the shutdown event to the bus so the same retire
 *      listener handles the signal path.
 *   3. Emit `register` so subsequent re-evals can find this instance.
 *
 * Listener errors from `bus.emit` are logged but never thrown out of
 * bootstrap — a buggy listener must not block the new instance from
 * coming up.
 */
const setupCloseListeners = async (
  app: FastifyInstance,
): Promise<CloseWithGraceReturn> => {
  const { bus: bootstrapLifecycleBus } = createBootstrapLifecycleBus();

  try {
    await bootstrapLifecycleBus.emit("retire", undefined);
  } catch (error) {
    app.log.error({ err: error }, "retire listeners failed during HMR re-eval");
  }

  const closeListeners = closeWithGrace(
    { delay: GRACEFUL_SHUTDOWN_TIMEOUT_MS, logger: app.log },
    async (event) => {
      try {
        await bootstrapLifecycleBus.emit("retire", event);
      } catch (error) {
        app.log.error(
          { err: error },
          "retire listeners failed during shutdown",
        );
      }
    },
  );

  try {
    await bootstrapLifecycleBus.emit("register", {
      app,
      handle: closeListeners,
    });
  } catch (error) {
    app.log.error({ err: error }, "register listeners failed");
  }

  return closeListeners;
};

const CloseHelper = Object.freeze({
  setupCloseListeners,
} as const);

export { CloseHelper };
