import type { LifecyclePriorInstance } from "@server/modules/bootstrap";

import type { LifecycleBusRegistryEntry } from "./lifecycle";

declare global {
  namespace globalThis {
    /**
     * Registry of named lifecycle buses. Pinned on first init via
     * `Object.defineProperty(..., { writable: false, configurable: false })`
     * so it survives `vite-node --watch` module re-eval (the process and
     * therefore `globalThis` persist; module-scope state resets per re-eval).
     */
    var __lifecycleBuses: Map<string, LifecycleBusRegistryEntry> | undefined;

    /**
     * Pointer to the most recently registered Fastify instance and its
     * close-with-grace handle. Written by the `register` listener (in
     * `modules/bootstrap/listeners/register-current.listener.ts`), read by
     * the `retire` listener. Not locked — its value mutates per register.
     */
    var __priorInstance: LifecyclePriorInstance | undefined;
  }
}
