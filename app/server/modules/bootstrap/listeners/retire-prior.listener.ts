import { SIGNALS_ERROR_MESSAGES } from "../constants";
import type { LifecycleRetirePayload } from "../types";

/**
 * Retires the most recently registered Fastify instance:
 *   - HMR path (payload `undefined`): closes the prior instance so the new
 *     bootstrap can install its own handle without listener accumulation.
 *   - Signal path (payload `{ err?, signal?, manual? }`): logs the cause
 *     via the prior instance's logger, then closes it. `close-with-grace`
 *     follows our callback with `process.exit(0)`, completing shutdown.
 *
 * Critical invariant: NEVER call `prior.handle.close()` here.
 * close-with-grace's `run()` always ends with `process.exit()`. In a shared
 * HMR process, that would kill the freshly-bootstrapping new instance
 * alongside the prior one. `handle.uninstall()` is the safe primitive —
 * it only detaches the prior's process-level signal/error listeners.
 */
const retirePrior = async (
  event: LifecycleRetirePayload | undefined,
): Promise<void> => {
  const prior = globalThis.__priorInstance;

  if (!prior) return;

  if (event) {
    if (event.err) {
      prior.app.log.error({ err: event.err }, "server closing with error");
    } else if (event.manual) {
      prior.app.log.info(
        "Another instance started (manual). Shutting down gracefully.",
      );
    } else {
      prior.app.log.info(
        (event.signal && SIGNALS_ERROR_MESSAGES.get(event.signal)) ??
          "Shutdown signal received. Shutting down gracefully.",
      );
    }
  }

  prior.handle.uninstall();

  await prior.app.close();
};

export { retirePrior };
