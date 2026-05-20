import type { CloseWithGraceReturn } from "@server/modules/bootstrap";
import type { FastifyInstance } from "fastify";

interface PriorInstance {
  app: FastifyInstance;
  handle: CloseWithGraceReturn;
}

declare global {
  /**
   * Pointer to the previous Fastify instance and its close-with-grace handle,
   * parked on `globalThis` so it survives vite-node `--watch` module re-eval
   * (module-scope state resets each re-eval; the Node process and therefore
   * `globalThis` persist).
   *
   * On each re-eval the new bootstrap closes the prior `app` directly and
   * calls `handle.uninstall()` to drop its process-level signal / exception
   * listeners. We deliberately do NOT call `handle.close()` — `close-with-grace`
   * always ends its run with `process.exit(0)`, which in the cross-process
   * cooperative-shutdown flow is the desired outcome but in same-process HMR
   * re-eval would kill the freshly-started instance along with the old one.
   */
  var __priorInstance: PriorInstance | undefined;
}
