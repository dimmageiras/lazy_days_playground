import { createLifecycleBus } from "@server/modules/lifecycle";
import type { LifecycleBusHandle } from "@server/modules/lifecycle";
import { LIFECYCLE_EVENTS } from "../constants";
import type { LifecycleEventMap } from "../types";

/**
 * Returns the bootstrap-lifecycle bus + its bus-bound `registerController`.
 *
 * `createLifecycleBus` is idempotent under the same `name`: the first call
 * creates the bus and pins it on `globalThis.__lifecycleBuses`; subsequent
 * calls (including those from a fresh module evaluation under
 * `vite-node --watch`) return the same bus instance. Callers therefore do
 * not need to share or memoize the result — each invocation is cheap and
 * the underlying bus identity is preserved.
 */
const createBootstrapLifecycleBus = (): LifecycleBusHandle<LifecycleEventMap> =>
  createLifecycleBus<LifecycleEventMap>({
    events: LIFECYCLE_EVENTS,
    name: "bootstrap-lifecycle",
  });

const BootstrapLifecycleHelper = Object.freeze({
  createBootstrapLifecycleBus,
} as const);

export { BootstrapLifecycleHelper };
