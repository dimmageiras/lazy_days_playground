# Generic Lifecycle Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `modules/lifecycle/` into a consumer-agnostic event-bus toolkit (a factory that mints typed buses) and move every bootstrap-flavored thing — events, payload types, listener functions — into `modules/bootstrap/`. The init layer shrinks to pure `bus.on(...)` wiring.

**Architecture:** A single `Map<string, BusEntry>` pinned on `globalThis.__lifecycleBuses` holds N named buses. `createLifecycleBus<EventMap>({ name, events, maxListeners? })` is idempotent under the same `name` (HMR-safe) and returns `{ bus, registerController }`. Each bus owns its own per-event listener sets, dispatching set, max-listeners count, and per-owner controllers map. Bootstrap declares `InstanceLifecycleEventMap`, calls the factory in `modules/bootstrap/bus/instance-lifecycle.bus.ts`, and ships its `retire`/`register` listener functions in `modules/bootstrap/listeners/`. The init in `inits/instance-lifecycle/` only does `bus.on()` wiring with controller-backed signals.

**Tech Stack:** Node.js 26+, TypeScript strict (`verbatimModuleSyntax`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `noUncheckedSideEffectImports`), Fastify 5, `close-with-grace` 2.5, `@fastify/error` 4, vite-node 6, `pnpm dev` as the runtime baseline.

**Tests:** Deferred per project policy. The factory is straightforwardly unit-testable; the smoke verification at the end of the plan is `pnpm dev` boot + HMR re-eval.

**Design source:** The decisions D1–D10 live in [`generic-lifecycle-module.plan.md` (this file, prior prose version preserved in git history)] and the runtime invariants (HMR singleton, AbortSignal cleanup, AggregateError aggregation, snapshot-before-iterate, reentrancy guard, listener-cap drop-on-exceed, allow-list runtime check, in-process trust boundary) are unchanged from [`instance-lifecycle-bus.plan.md`](./instance-lifecycle-bus.plan.md).

---

## Project conventions to follow

The plan I previously wrote drifted from current codebase patterns. Each task below conforms to these conventions (verified against the live repo):

1. **Module-facade objects are `Object.freeze({...} as const)`** — every helper, route, and init exports a frozen named object (e.g. `CloseHelper`, `ShutdownRoute`, `InstanceLifecycleInit`). Listener files are plain function exports (no facade).
2. **Import grouping**: third-party first → blank line → `@server/...` / `@shared/...` aliases → blank line → relative `../` / `./`. Type-only imports use `import type`.
3. **Path aliases for cross-module, relative for in-module**: `close.helper.ts` (inside bootstrap) imports `BOOTSTRAP_TIMING` via `../constants/bootstrap.constant`; imports `@server/modules/lifecycle` via the alias. Match this in every new/modified file.
4. **Filename suffixes**: `.constant.ts`, `.helper.ts`, `.module.ts`, `.route.ts`, `.type.ts`, `.init.ts`, `.listener.ts`, `.event.ts`, `.bus.ts`. Declare-global augmentations use `.t.ts`; ambient type files use `.d.ts`. Match strictly.
5. **Cross-cutting type augmentations live in `app/server/types/app/`** — `global-this.t.ts` (declare global) and `lifecycle.d.ts` (the `PriorInstance` interface). Do **not** move these into individual modules.
6. **`Object.hasOwn` for allow-list checks** (already in bus today) — not `event in EVENTS`.
7. **Strict typing for events**: `EVENTS = Object.freeze({...} satisfies Record<keyof EventMap, keyof EventMap>)`. `EventName = keyof EventMap`. EVENTS is the runtime mirror; EventMap is the contract.
8. **Bus-bound helpers return frozen objects**: the factory's return is `Object.freeze({ bus, registerController } as const)`.

## File map (full destination state)

```
app/server/
  inits/
    inits.ts                                ← unchanged
    index.ts                                ← unchanged
    instance-lifecycle/
      instance-lifecycle.init.ts            ← MODIFIED: import bus + listeners from bootstrap
      index.ts                              ← unchanged
      listeners/                            ← DELETED
        retire-prior.listener.ts            ← DELETED (moved)
        register-current.listener.ts        ← DELETED (moved)
        index.ts                            ← DELETED

  modules/
    bootstrap/
      bus/                                  ← NEW folder
        instance-lifecycle.bus.ts           ← NEW
        index.ts                            ← NEW
      events/                               ← NEW folder
        instance-lifecycle.event.ts         ← NEW
        index.ts                            ← NEW
      listeners/                            ← NEW folder
        retire-prior.listener.ts            ← NEW (moved from inits/)
        register-current.listener.ts        ← NEW (moved from inits/)
        index.ts                            ← NEW
      helpers/
        close.helper.ts                     ← MODIFIED: import bus from ../bus
        ... (other helpers unchanged)
      constants/                            ← unchanged
      routes/                               ← unchanged
      types/                                ← unchanged
      bootstrap.module.ts                   ← unchanged

    lifecycle/
      lifecycle.bus.ts                      ← MODIFIED: factory + registry
      lifecycle.error.ts                    ← unchanged
      index.ts                              ← MODIFIED: new exports only
      lifecycle.controller.ts               ← DELETED
      lifecycle.event.ts                    ← DELETED

  types/
    app/
      global-this.t.ts                      ← MODIFIED: swap singleton globals for __lifecycleBuses
      lifecycle.d.ts                        ← unchanged (PriorInstance stays)
```

---

## Task 1: Define the instance-lifecycle event contract (bootstrap-owned)

**Files:**
- Create: `app/server/modules/bootstrap/events/instance-lifecycle.event.ts`
- Create: `app/server/modules/bootstrap/events/index.ts`

- [ ] **Step 1: Write `instance-lifecycle.event.ts`**

```ts
import type { Signals } from "close-with-grace";
import type { FastifyInstance } from "fastify";

import type { CloseWithGraceReturn } from "../types/bootstrap.type";

interface RetirePayload {
  readonly err?: Error;
  readonly manual?: boolean;
  readonly signal?: Signals;
}

interface RegisterPayload {
  readonly app: FastifyInstance;
  readonly handle: CloseWithGraceReturn;
}

interface InstanceLifecycleEventMap {
  register: RegisterPayload;
  retire: RetirePayload | undefined;
}

type InstanceLifecycleEventName = keyof InstanceLifecycleEventMap;

const INSTANCE_LIFECYCLE_EVENTS = Object.freeze({
  register: "register",
  retire: "retire",
} satisfies Record<
  InstanceLifecycleEventName,
  InstanceLifecycleEventName
>);

export { INSTANCE_LIFECYCLE_EVENTS };
export type {
  InstanceLifecycleEventMap,
  InstanceLifecycleEventName,
  RegisterPayload,
  RetirePayload,
};
```

- [ ] **Step 2: Write `events/index.ts`**

```ts
export { INSTANCE_LIFECYCLE_EVENTS } from "./instance-lifecycle.event";
export type {
  InstanceLifecycleEventMap,
  InstanceLifecycleEventName,
  RegisterPayload,
  RetirePayload,
} from "./instance-lifecycle.event";
```

- [ ] **Step 3: Type-check sanity**

This step has no runtime check yet (no consumer imports these types). Confirm the files exist and the path alias works by reading them back. No commit yet — bundle with Task 2.

---

## Task 2: Refactor `lifecycle.bus.ts` to factory + registry shape

**Files:**
- Modify: `app/server/modules/lifecycle/lifecycle.bus.ts` (full rewrite)

The current file pins one bus + one controllers map on `globalThis.__lifecycleBus` / `__lifecycleControllers`. The new file pins one `Map<string, BusEntry>` on `globalThis.__lifecycleBuses` and exports a factory that returns `{ bus, registerController }`. All current runtime invariants (snapshot-before-iterate, AggregateError aggregation, reentrancy guard, listener-cap drop-on-exceed, allow-list, AbortSignal cleanup) are preserved.

- [ ] **Step 1: Replace `lifecycle.bus.ts` with the new contents**

```ts
/**
 * In-process generic lifecycle event bus.
 *
 * `createLifecycleBus<EventMap>({ name, events, maxListeners? })` returns
 * `{ bus, registerController }` for the given name. The first call under a
 * given name creates a `BusEntry` (the bus + its per-owner controllers map)
 * inside a single `Map<string, BusEntry>` pinned on
 * `globalThis.__lifecycleBuses` via `Object.defineProperty`. Subsequent
 * calls under the same name return the same entry — which is what makes
 * `vite-node --watch` re-eval safe: consumer modules re-run the factory
 * call on every re-eval and get a stable identity back.
 *
 * Boundary: **in-process only**. A second Node process has its own
 * `globalThis` and therefore its own registry. Cross-process handover
 * stays the cooperative-shutdown HTTP route's job.
 *
 * Trust model: listeners are trusted code, not user input. The bus
 * runtime-validates only that event names appear in the consumer-supplied
 * `events` constant; payload shapes are TypeScript's job.
 */

import { ReentrancyError } from "@server/modules/lifecycle/lifecycle.error";

const REGISTRY_KEY = "__lifecycleBuses";
const DEFAULT_MAX_LISTENERS = 5;

type AnyEventMap = Record<string, unknown>;
type AnyListener = (payload: unknown) => void | Promise<void>;

type EventNameOf<EventMap extends AnyEventMap> = keyof EventMap & string;

type Listener<EventMap extends AnyEventMap, K extends EventNameOf<EventMap>> = (
  payload: EventMap[K],
) => void | Promise<void>;

interface OnOptions {
  readonly signal?: AbortSignal;
}

interface Bus<EventMap extends AnyEventMap> {
  emit<K extends EventNameOf<EventMap>>(
    event: K,
    payload: EventMap[K],
  ): Promise<void>;
  listenerCount(event: EventNameOf<EventMap>): number;
  on<K extends EventNameOf<EventMap>>(
    event: K,
    listener: Listener<EventMap, K>,
    options?: OnOptions,
  ): () => void;
  setMaxListeners(count: number): void;
}

interface CreateLifecycleBusConfig<EventMap extends AnyEventMap> {
  readonly events: Readonly<
    Record<EventNameOf<EventMap>, EventNameOf<EventMap>>
  >;
  readonly maxListeners?: number;
  readonly name: string;
}

interface LifecycleBusHandle<EventMap extends AnyEventMap> {
  readonly bus: Bus<EventMap>;
  readonly registerController: (key: string) => AbortController;
}

interface BusEntry {
  readonly bus: Bus<AnyEventMap>;
  readonly controllers: Map<string, AbortController>;
}

const ensureSingleton = <T>(key: string, factory: () => T): T => {
  if (key in globalThis) {
    return (globalThis as Record<string, unknown>)[key] as T;
  }
  const value = factory();
  Object.defineProperty(globalThis, key, {
    configurable: false,
    enumerable: false,
    value,
    writable: false,
  });
  return value;
};

const registry = ensureSingleton(
  REGISTRY_KEY,
  () => new Map<string, BusEntry>(),
);

const createBus = <EventMap extends AnyEventMap>(
  config: CreateLifecycleBusConfig<EventMap>,
): Bus<EventMap> => {
  const { events } = config;
  const listeners = new Map<EventNameOf<EventMap>, Set<AnyListener>>();
  const dispatching = new Set<EventNameOf<EventMap>>();
  let maxListeners = config.maxListeners ?? DEFAULT_MAX_LISTENERS;

  const isKnownEvent = (event: unknown): event is EventNameOf<EventMap> =>
    typeof event === "string" && Object.hasOwn(events, event);

  const getOrCreateSet = (
    event: EventNameOf<EventMap>,
  ): Set<AnyListener> =>
    listeners.getOrInsertComputed(event, () => new Set());

  const on = <K extends EventNameOf<EventMap>>(
    event: K,
    listener: Listener<EventMap, K>,
    options?: OnOptions,
  ): (() => void) => {
    if (!isKnownEvent(event)) {
      throw new TypeError(
        `lifecycleBus("${config.name}").on: unknown event "${String(event)}". Known: ${Object.keys(events).join(", ")}`,
      );
    }

    const set = getOrCreateSet(event);

    if (set.size >= maxListeners) {
      console.error(
        `lifecycleBus("${config.name}"): listener cap (${maxListeners}) reached for "${event}" — new listener dropped`,
      );
      return () => undefined;
    }

    const widened = listener as AnyListener;
    set.add(widened);

    let removed = false;
    const remove = (): void => {
      if (removed) return;
      removed = true;
      set.delete(widened);
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        remove();
      } else {
        options.signal.addEventListener("abort", remove, { once: true });
      }
    }

    return remove;
  };

  const emit = async <K extends EventNameOf<EventMap>>(
    event: K,
    payload: EventMap[K],
  ): Promise<void> => {
    if (!isKnownEvent(event)) {
      throw new TypeError(
        `lifecycleBus("${config.name}").emit: unknown event "${String(event)}". Known: ${Object.keys(events).join(", ")}`,
      );
    }

    if (dispatching.has(event)) {
      throw new ReentrancyError(event);
    }

    const set = listeners.get(event);
    if (!set || set.size === 0) return;

    // Snapshot before iteration — mirrors Node EventEmitter's in-flight
    // stability: removeListener calls during emit do not skip siblings.
    const snapshot = [...set];
    const errors: unknown[] = [];

    dispatching.add(event);
    try {
      for (const listener of snapshot) {
        try {
          await listener(payload);
        } catch (err) {
          errors.push(err);
        }
      }
    } finally {
      dispatching.delete(event);
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `lifecycleBus("${config.name}").emit("${event}") had ${errors.length} listener error(s)`,
      );
    }
  };

  const setMaxListeners = (count: number): void => {
    if (!Number.isInteger(count) || count < 0) {
      throw new TypeError(
        `lifecycleBus("${config.name}").setMaxListeners: expected non-negative integer, got ${count}`,
      );
    }
    maxListeners = count;
  };

  const listenerCount = (event: EventNameOf<EventMap>): number =>
    listeners.get(event)?.size ?? 0;

  return Object.freeze({
    emit,
    listenerCount,
    on,
    setMaxListeners,
  });
};

const createLifecycleBus = <EventMap extends AnyEventMap>(
  config: CreateLifecycleBusConfig<EventMap>,
): LifecycleBusHandle<EventMap> => {
  let entry = registry.get(config.name);
  if (!entry) {
    entry = Object.freeze({
      bus: createBus<EventMap>(config) as Bus<AnyEventMap>,
      controllers: new Map<string, AbortController>(),
    });
    registry.set(config.name, entry);
  }

  const { bus, controllers } = entry;

  const registerController = (key: string): AbortController => {
    controllers.get(key)?.abort();
    const controller = new AbortController();
    controllers.set(key, controller);
    return controller;
  };

  return Object.freeze({
    bus: bus as Bus<EventMap>,
    registerController,
  });
};

export { createLifecycleBus };
export type { Bus, CreateLifecycleBusConfig, LifecycleBusHandle, OnOptions };
```

- [ ] **Step 2: No commit yet** — the new exports won't satisfy current consumers until later tasks switch them. Move on.

---

## Task 3: Update `modules/lifecycle/index.ts` to the new public surface

**Files:**
- Modify: `app/server/modules/lifecycle/index.ts` (full rewrite)

- [ ] **Step 1: Replace contents**

```ts
export { createLifecycleBus } from "@server/modules/lifecycle/lifecycle.bus";
export type {
  Bus,
  CreateLifecycleBusConfig,
  LifecycleBusHandle,
  OnOptions,
} from "@server/modules/lifecycle/lifecycle.bus";
export { ReentrancyError } from "@server/modules/lifecycle/lifecycle.error";
```

- [ ] **Step 2: No commit yet.** Old consumers (`close.helper.ts`, `instance-lifecycle.init.ts`, the listener files) still import the now-deleted exports. Subsequent tasks switch them.

---

## Task 4: Update `types/app/global-this.t.ts` — registry instead of singletons

**Files:**
- Modify: `app/server/types/app/global-this.t.ts`

- [ ] **Step 1: Replace `__lifecycleBus` + `__lifecycleControllers` with `__lifecycleBuses`**

The file currently declares three globals: `__lifecycleBus`, `__lifecycleControllers`, `__priorInstance`. After this task, the first two are gone and `__lifecycleBuses` (the registry) takes their place. `__priorInstance` stays — bootstrap still owns it. Imports update to reference the new bus type module.

```ts
import type { Bus } from "@server/modules/lifecycle";

import type { PriorInstance } from "./lifecycle";

interface LifecycleBusRegistryEntry {
  readonly bus: Bus<Record<string, unknown>>;
  readonly controllers: Map<string, AbortController>;
}

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
    var __priorInstance: PriorInstance | undefined;
  }
}
```

- [ ] **Step 2: No commit yet.** TypeScript will still complain about `liveControllers` being deleted from `lifecycle.bus.ts` — fixed when the controller file is deleted in Task 9.

---

## Task 5: Create the instance-lifecycle bus instance (bootstrap-owned)

**Files:**
- Create: `app/server/modules/bootstrap/bus/instance-lifecycle.bus.ts`
- Create: `app/server/modules/bootstrap/bus/index.ts`

- [ ] **Step 1: Write `instance-lifecycle.bus.ts`**

```ts
import { createLifecycleBus } from "@server/modules/lifecycle";

import {
  INSTANCE_LIFECYCLE_EVENTS,
  type InstanceLifecycleEventMap,
} from "../events/instance-lifecycle.event";

const { bus: instanceLifecycleBus, registerController } =
  createLifecycleBus<InstanceLifecycleEventMap>({
    events: INSTANCE_LIFECYCLE_EVENTS,
    name: "instance-lifecycle",
  });

export { instanceLifecycleBus, registerController };
```

- [ ] **Step 2: Write `bus/index.ts`**

```ts
export {
  instanceLifecycleBus,
  registerController,
} from "./instance-lifecycle.bus";
```

- [ ] **Step 3: No commit yet** — bundle with Task 6 listener move.

---

## Task 6: Move listener functions into bootstrap

**Files:**
- Create: `app/server/modules/bootstrap/listeners/retire-prior.listener.ts`
- Create: `app/server/modules/bootstrap/listeners/register-current.listener.ts`
- Create: `app/server/modules/bootstrap/listeners/index.ts`

The bodies are identical to the current files in `inits/instance-lifecycle/listeners/` except the type imports now point at bootstrap's own `events/` folder (relative) instead of at `@server/modules/lifecycle`.

- [ ] **Step 1: Write `retire-prior.listener.ts`**

```ts
import { SIGNALS_ERROR_MESSAGES } from "../constants/bootstrap.constant";
import type { RetirePayload } from "../events/instance-lifecycle.event";

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
  event: RetirePayload | undefined,
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
```

- [ ] **Step 2: Write `register-current.listener.ts`**

```ts
import type { RegisterPayload } from "../events/instance-lifecycle.event";

const registerCurrent = ({ app, handle }: RegisterPayload): void => {
  globalThis.__priorInstance = { app, handle };
};

export { registerCurrent };
```

- [ ] **Step 3: Write `listeners/index.ts`**

```ts
export { registerCurrent } from "./register-current.listener";
export { retirePrior } from "./retire-prior.listener";
```

- [ ] **Step 4: No commit yet.** Old listener files in `inits/...` still exist; deleted in Task 9.

---

## Task 7: Switch `close.helper.ts` to bootstrap's bus

**Files:**
- Modify: `app/server/modules/bootstrap/helpers/close.helper.ts`

- [ ] **Step 1: Swap the `lifecycleBus` import for `instanceLifecycleBus`**

Find this block at the top of `close.helper.ts`:

```ts
import { lifecycleBus } from "@server/modules/lifecycle";

import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";
import type { CloseWithGraceReturn } from "../types/bootstrap.type";
```

Replace with:

```ts
import { instanceLifecycleBus } from "../bus";
import { BOOTSTRAP_TIMING } from "../constants/bootstrap.constant";
import type { CloseWithGraceReturn } from "../types/bootstrap.type";
```

(Note: the bus is in-module, so use a relative path. Per convention from `listen.helper.ts`, sibling-folder imports stay relative.)

- [ ] **Step 2: Rename `lifecycleBus` → `instanceLifecycleBus` in the three `emit` calls**

Find:
```ts
await lifecycleBus.emit("retire", undefined);
```
Replace with:
```ts
await instanceLifecycleBus.emit("retire", undefined);
```

Find:
```ts
await lifecycleBus.emit("retire", event);
```
Replace with:
```ts
await instanceLifecycleBus.emit("retire", event);
```

Find:
```ts
await lifecycleBus.emit("register", { app, handle: closeListeners });
```
Replace with:
```ts
await instanceLifecycleBus.emit("register", { app, handle: closeListeners });
```

- [ ] **Step 3: No commit yet** — bundle with Task 8.

---

## Task 8: Switch `instance-lifecycle.init.ts` to bootstrap's bus + listeners

**Files:**
- Modify: `app/server/inits/instance-lifecycle/instance-lifecycle.init.ts` (full rewrite)

- [ ] **Step 1: Replace contents**

```ts
import {
  instanceLifecycleBus,
  registerController,
} from "@server/modules/bootstrap/bus";
import {
  registerCurrent,
  retirePrior,
} from "@server/modules/bootstrap/listeners";

/**
 * Wires the bootstrap-side subscribers onto the instance-lifecycle bus.
 *
 * Runs once per `vite-node --watch` re-eval. `registerController` aborts
 * the prior controller stored under each key (auto-removing the prior
 * listeners), so re-entrant calls do not accumulate listeners across saves.
 */
const initInstanceLifecycle = (): void => {
  const retireSignal = registerController("bootstrap:retire-prior").signal;
  instanceLifecycleBus.on("retire", retirePrior, { signal: retireSignal });

  const registerSignal = registerController("bootstrap:register-current")
    .signal;
  instanceLifecycleBus.on("register", registerCurrent, {
    signal: registerSignal,
  });
};

const InstanceLifecycleInit = Object.freeze({
  initInstanceLifecycle,
} as const);

export { InstanceLifecycleInit };
```

- [ ] **Step 2: No commit yet** — bundle with Task 9's cleanup.

---

## Task 9: Delete obsolete files

**Files:**
- Delete: `app/server/inits/instance-lifecycle/listeners/retire-prior.listener.ts`
- Delete: `app/server/inits/instance-lifecycle/listeners/register-current.listener.ts`
- Delete: `app/server/inits/instance-lifecycle/listeners/index.ts`
- Delete: `app/server/inits/instance-lifecycle/listeners/` (directory)
- Delete: `app/server/modules/lifecycle/lifecycle.controller.ts`
- Delete: `app/server/modules/lifecycle/lifecycle.event.ts`

- [ ] **Step 1: Remove the old listeners under `inits/`**

```bash
rm -rf app/server/inits/instance-lifecycle/listeners
```

- [ ] **Step 2: Remove the obsolete lifecycle files**

```bash
rm app/server/modules/lifecycle/lifecycle.controller.ts
rm app/server/modules/lifecycle/lifecycle.event.ts
```

- [ ] **Step 3: Confirm no stragglers reference the deleted files**

Search the source tree for any remaining import of `@server/modules/lifecycle/lifecycle.controller` or `@server/modules/lifecycle/lifecycle.event`. Both should return zero hits.

```bash
grep -r "lifecycle.controller\|lifecycle.event" app/server --include="*.ts"
```

Expected: empty output.

- [ ] **Step 4: Confirm the inits listeners folder is gone**

```bash
ls app/server/inits/instance-lifecycle 2>&1
```

Expected: shows only `index.ts` and `instance-lifecycle.init.ts`.

---

## Task 10: Smoke test the new wiring

**Files:**
- (Read-only) verify `pnpm dev` boots and HMR re-eval works.

- [ ] **Step 1: Start the dev server in the background**

```bash
pnpm dev
```

Watch the output for a `Server listening at http://127.0.0.1:5173` line. Capture the PID printed in the log prefix (e.g. `INFO (NNNNN):`).

- [ ] **Step 2: Trigger HMR by touching the entry**

```bash
touch app/server/server.ts
```

Wait for a second `Server listening at http://127.0.0.1:5173` line.

Expected:
- Second listen line appears within a few seconds
- Same PID across both boots (singleton survived)
- No errors in the output

- [ ] **Step 3: Stop the dev server (Ctrl+C) and inspect the shutdown log**

Expected: exactly one log line about `Shutdown signal received. Shutting down gracefully.` (or the SIGINT-specific message from `SIGNALS_ERROR_MESSAGES`). No `ReentrancyError`, no `AggregateError`, no `Cannot find module` errors.

- [ ] **Step 4: Commit the entire refactor**

```bash
git add app/server docs/plans/generic-lifecycle-module.plan.md
git commit -m "$(cat <<'EOF'
refactor(lifecycle): genericize bus, move event contract + listeners to bootstrap

modules/lifecycle/ now exports a single createLifecycleBus<EventMap>(...)
factory backed by a Map<name, BusEntry> registry pinned on globalThis.
Bootstrap declares its own InstanceLifecycleEventMap, RetirePayload,
RegisterPayload, owns the retire/register listener functions, and creates
its bus instance in modules/bootstrap/bus/. The init layer shrinks to
pure bus.on() wiring.

Runtime invariants (HMR singleton survival, AbortSignal cleanup,
AggregateError aggregation, snapshot-before-iterate, reentrancy guard,
listener-cap drop-on-exceed, allow-list runtime check) are preserved.
EOF
)"
```

---

## Self-review checklist (run after all tasks complete)

- [ ] **Spec coverage**: every section of `docs/plans/generic-lifecycle-module.plan.md` design intent (D1–D10) is implemented or explicitly deferred. The 10 hardening-checklist invariants from `instance-lifecycle-bus.plan.md` are preserved.
- [ ] **No placeholder leakage**: no `TBD`, `TODO`, `// implement later`, no `Object.hasOwn` replaced with `in`, no empty try/catch.
- [ ] **Type consistency**: `InstanceLifecycleEventMap` keys (`retire`, `register`) match `INSTANCE_LIFECYCLE_EVENTS` keys exactly. `RetirePayload` / `RegisterPayload` field names match `close.helper.ts`'s `bus.emit("retire", event)` and `bus.emit("register", { app, handle })` call sites.
- [ ] **Import grouping convention**: each touched file groups imports as third-party → blank line → `@server/...` aliases → blank line → relative `../` imports. Type-only imports use `import type`.
- [ ] **`Object.freeze` discipline**: `INSTANCE_LIFECYCLE_EVENTS`, `InstanceLifecycleInit`, the bus factory's returned handle, and the bus implementation are all frozen. Listener files are plain function exports (not frozen objects).
- [ ] **Path-alias discipline**: in-module imports stay relative (`../bus`, `../events/...`); cross-module imports use aliases (`@server/modules/lifecycle`).
- [ ] **No orphan code**: `grep -r "lifecycle.controller\|lifecycle.event\|inits/instance-lifecycle/listeners" app/server --include="*.ts"` returns empty.
- [ ] **Global augmentation correct**: `app/server/types/app/global-this.t.ts` declares `__lifecycleBuses` and `__priorInstance` only — `__lifecycleBus` and `__lifecycleControllers` removed.

## Open items deferred from this PR

These are intentionally not implemented; they are recorded so a future agent doesn't re-open them as "missing":

1. **Tests.** Deferred per project policy. The factory shape makes the bus unit-testable in isolation (synthetic event map, no globalThis pinning needed for a single-test process).
2. **Logger injection for the listener-cap-exceeded path.** Currently `console.error`. Could become a factory config `logger?` once a real consumer needs structured logging here.
3. **Registry introspection (`listBuses()`, `getBus(name)`).** Add when tests or dev tools need it.
4. **`name`-collision-with-different-`events` shape check.** Today the second caller silently inherits the first's allow-list. Defer until it bites.
5. **Bus-identity validation on registry read.** Mitigated by load-order (transitively, `@server/modules/lifecycle` is imported before any code that could race the slot); could be hardened with a structural check inside `ensureSingleton`. Out of scope here.

---

**Plan complete and saved to `docs/plans/generic-lifecycle-module.plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

**Which approach?**
