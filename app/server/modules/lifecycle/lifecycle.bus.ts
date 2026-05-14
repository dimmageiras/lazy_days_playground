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

/**
 * Self-referential homomorphic mapped-type constraint.
 *
 * A direct `EventMap extends Record<string, unknown>` constraint rejects
 * `interface` declarations because TS treats interfaces as augmentable
 * via declaration merging (open shape) and refuses to assign them to
 * indexed records. Mapping `EventMap` onto itself produces an equivalent
 * closed structural type at the constraint-check site, so both
 * `interface` and `type` event maps are accepted without losing key-level
 * inference.
 */
type EventMapConstraint<EventMap> = {
  [K in keyof EventMap]: EventMap[K];
};

type AnyEventMap = Record<string, unknown>;
type AnyListener = (payload: unknown) => void | Promise<void>;

type EventNameOf<EventMap extends EventMapConstraint<EventMap>> =
  keyof EventMap & string;

type Listener<
  EventMap extends EventMapConstraint<EventMap>,
  K extends EventNameOf<EventMap>,
> = (payload: EventMap[K]) => void | Promise<void>;

interface OnOptions {
  readonly signal?: AbortSignal;
}

interface Bus<EventMap extends EventMapConstraint<EventMap>> {
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

interface CreateLifecycleBusConfig<
  EventMap extends EventMapConstraint<EventMap>,
> {
  readonly events: Readonly<Record<string, EventNameOf<EventMap>>>;
  readonly maxListeners?: number;
  readonly name: string;
}

interface LifecycleBusHandle<EventMap extends EventMapConstraint<EventMap>> {
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

const createBus = <EventMap extends EventMapConstraint<EventMap>>(
  config: CreateLifecycleBusConfig<EventMap>,
): Bus<EventMap> => {
  const { events } = config;
  const knownEventNames = new Set<string>(Object.values(events));
  const listeners = new Map<EventNameOf<EventMap>, Set<AnyListener>>();
  const dispatching = new Set<EventNameOf<EventMap>>();
  let maxListeners = config.maxListeners ?? DEFAULT_MAX_LISTENERS;

  const isKnownEvent = (event: unknown): event is EventNameOf<EventMap> =>
    typeof event === "string" && knownEventNames.has(event);

  const getOrCreateSet = (event: EventNameOf<EventMap>): Set<AnyListener> =>
    listeners.getOrInsertComputed(event, () => new Set());

  const on = <K extends EventNameOf<EventMap>>(
    event: K,
    listener: Listener<EventMap, K>,
    options?: OnOptions,
  ): (() => void) => {
    if (!isKnownEvent(event)) {
      throw new TypeError(
        `lifecycleBus("${config.name}").on: unknown event "${String(event)}". Known: ${[...knownEventNames].join(", ")}`,
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
        `lifecycleBus("${config.name}").emit: unknown event "${String(event)}". Known: ${[...knownEventNames].join(", ")}`,
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

const createLifecycleBus = <EventMap extends EventMapConstraint<EventMap>>(
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
