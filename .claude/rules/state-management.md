# State management

This project splits state across two libraries with non-overlapping responsibilities. Follow the lane and the conventions below before adding or refactoring any state.

## Lanes

- **Server state** (anything fetched from an API, the database, or any external system) → **TanStack Query**. Owned by the `tanstack-query-best-practices` skill.
- **Client state** (UI flags, local form state, ephemeral selections, session, theme) → **Zustand**, accessed through the `zustand-x` wrapper. The general patterns are owned by the `zustand` skill; the wrapper-specific conventions are below.

Never put server state in Zustand. Never put client-only state in TanStack Query.

## Zustand conventions (`zustand-x` wrapper)

The project does not call vanilla Zustand directly. All stores go through `zustand-x`, which adds tracked-store ergonomics (proxy-based auto-tracking) on top of `zustand@5`. The installed `zustand` skill teaches vanilla idioms — adapt them to the wrapper as follows.

### Use `createStore` from `zustand-x`, not `create` from `zustand`

```ts
// Yes
import { createStore } from "zustand-x";

const store = createStore(initialState, {
  devtools: true,
  name: "my-store",
});

// No — bypasses the tracked-store hooks the components rely on
import { create } from "zustand";
const useStore = create<State>()((set) => ({ ... }));
```

### Configure middleware via the option bag

`zustand-x` takes middleware as a config object, not nested higher-order functions. The `name` field is **required**; everything else is optional.

```ts
// Yes
createStore(state, {
  name: "x",                    // required
  devtools: true,               // boolean, or { enabled, name, ... }
  persist: true,                // boolean, or zustand persist options + { enabled }
  immer: true,                  // boolean, or { enableMapSet, enabledAutoFreeze, enabled }
  // mutative: true,            // also supported — use immer or mutative, not both
});

// No
devtools(persist(immer(create(...))));
```

`subscribeWithSelector` is **always applied internally** by `zustand-x` and is not configurable through the option bag. It is also not surfaced in the type-level mutator tuple, so don't add it to `TStateApi`.

`persist` is a passthrough to zustand's `persist` middleware — all of `name`, `storage`, `partialize`, `version`, `migrate`, `merge`, `skipHydration`, `onRehydrateStorage` apply unchanged. `name` falls back to the store's top-level `name` when omitted.

> **Production gating** — never set `devtools: true` unconditionally. Gate on a build-time env flag (e.g. `import.meta.env.DEV` or a project-level constant) so the Redux DevTools listener stays out of production bundles. The bare `true` in the examples below is shorthand for the gated value.

### Type stores with `TStateApi`, not `StateCreator`

`zustand-x` types are surfaced via `TStateApi<State, Mutators, TActions, TSelectors>`. The mutator tuple must match the option bag, in this fixed source order: **devtools → persist → immer → mutative**. Each enabled flag adds its slot; disabled flags are dropped.

| Enabled                             | Mutator tuple                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `devtools`                          | `[["zustand/devtools", never]]`                                                                     |
| `persist`                           | `[["zustand/persist", Partial<State>]]`                                                             |
| `immer`                             | `[["zustand/immer-x", never]]`                                                                      |
| `mutative`                          | `[["zustand/mutative-x", never]]`                                                                   |
| `devtools` + `persist` + `immer`    | `[["zustand/devtools", never], ["zustand/persist", Partial<State>], ["zustand/immer-x", never]]`    |
| `devtools` + `persist` + `mutative` | `[["zustand/devtools", never], ["zustand/persist", Partial<State>], ["zustand/mutative-x", never]]` |

`zustand-x` rebrands `immer` and `mutative` mutator tags (`zustand/immer-x`, `zustand/mutative-x`) — do **not** copy `zustand/immer` from vanilla Zustand docs.

The library's defaults for `TActions` and `TSelectors` are both `{}`. Using `Record<string, AnyFunction>` (as the scoped-store example below uses) is a **permissive fallback** — it accepts any action/selector key but loses key-level autocomplete on `store.set("name", ...)`. Prefer chaining `extendActions` / `extendSelectors` (next section) and let `TStateApi` infer the keys.

### Slices via `extendActions` / `extendSelectors`

`zustand-x` exposes two chainable extension methods on the store. Each returns a fresh, narrower `TStateApi` with the new keys merged into the type.

```ts
const store = createStore(initialState, { name: "extended" })
  .extendActions(({ get, set }) => ({
    increment: () => set("count", get("count") + 1),
  }))
  .extendSelectors(({ get }) => ({
    isZero: () => get("count") === 0,
  }));
```

`extendMiddleware` does **not** exist — middleware is configured only via the option bag at `createStore` time.

### Module-level singleton stores

For state that is **genuinely global to the app** (UI flags, app-wide selections, etc.), declare a single store at module level with an inline-typed `initialState` literal.

```ts
const initialState: { count: number; isOpen: boolean } = {
  count: 0,
  isOpen: false,
};

const counterStore = createStore(initialState, {
  devtools: true,
  name: "counter",
});

export { counterStore };
```

#### Consuming a singleton in React components

There is no Context plumbing to hide, so components import the singleton and call `useStoreState` / `useTrackedStore` from `zustand-x` directly — **no custom-hook wrapper layer**.

```ts
import { useStoreState, useTracked, useTrackedStore } from "zustand-x";
import { counterStore } from "...";

const [count, setCount] = useStoreState(counterStore, "count"); // read + write tuple
const { isOpen } = useTrackedStore(counterStore); // full proxy, destructured
const isOpenOnly = useTracked(counterStore, "isOpen"); // single-key proxy
```

#### Mutating a singleton from outside React

The store API exposes `get(key)`, `set(key, value)`, `getInitialState()`, `subscribe(callback)`, plus the chainable `extendActions` / `extendSelectors` directly on the store object. Helpers, tests, event handlers, and other non-React code use these methods without going through hooks.

```ts
counterStore.set("count", counterStore.get("count") + 1);
counterStore.set("isOpen", false);
```

### Scoped stores via Context + factory

When the store is **per-request, per-tenant, or per-route** (sessions, tenants, routes), build a factory + Context + Provider, then expose the four-hook access set (next section). Freeze the store reference (Step 2).

#### 1. State and store types (separate file)

```ts
import type { AnyFunction, TStateApi } from "zustand-x";

interface State {
  id: string;
  enabled: boolean;
}

type Store = TStateApi<
  State,
  [["zustand/devtools", never]],
  Record<string, AnyFunction>,
  Record<string, AnyFunction>
>;

export type { State, Store };
```

#### 2. Factory

```ts
const createScopedStore = (initialState: Readonly<State>): Readonly<Store> => {
  const store = createStore(initialState, {
    devtools: true,
    name: "scoped-store",
  });

  return Object.freeze(store);
};
```

#### 3. Context

```ts
import type { Store } from "...";

import { createContext } from "react";

const StoreContext = createContext<Store | null>(null);

export { StoreContext };
```

#### 4. Provider — `useMemo` over **primitive props**

Never `useMemo` over an object literal passed in as a prop (`[initialState]`) — the dep changes identity every render and the store rebuilds. Memo over the primitives that drive initial state.

```ts
import type { JSX, PropsWithChildren } from "react";

import { useMemo } from "react";

interface StoreProviderProps extends PropsWithChildren {
  id: string;
  enabled: boolean;
}

const StoreProvider = ({
  children,
  id,
  enabled,
}: StoreProviderProps): JSX.Element => {
  const store = useMemo(
    () => createScopedStore({ id, enabled }),
    [id, enabled],
  );

  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};
```

### The four-hook access set (scoped stores only)

Scoped stores have Context plumbing that components must not see. Each scoped store gets four typed hooks that hide the Context, the guard, and `zustand-x`'s hook signatures. Freeze every return value.

(Module-level singletons skip this layer — see [Consuming a singleton in React components](#consuming-a-singleton-in-react-components) above.)

```ts
import { useContext } from "react";
import { useStoreState, useTracked, useTrackedStore } from "zustand-x";

// 1. Context-guard hook — throws if used outside the provider
const useStoreContext = (): Store => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStoreContext must be used within StoreProvider");
  }

  return context;
};

// 2. Full proxy — re-renders on any field the consumer reads
const useScopedTrackedStore = (): Readonly<State> => {
  const store = useStoreContext();
  const trackedStore = useTrackedStore(store);

  return Object.freeze(trackedStore);
};

// 3. Single-key proxy — generic over keys of State
const useScopedTrackedValue = <K extends keyof State>(
  key: K,
): Readonly<State[K]> => {
  const store = useStoreContext();
  const trackedValue = useTracked(store, key);

  return Object.freeze(trackedValue);
};

// 4. Tuple [value, setter] — for input-style two-way binding
const useScopedField = <K extends keyof State>(
  key: K,
): readonly [State[K], (value: State[K]) => void] => {
  const store = useStoreContext();
  const [value, setValue] = useStoreState(store, key);

  return Object.freeze([value, setValue]);
};
```

## Adapting patterns from the `zustand` skill

The installed `zustand` skill (and its `references/`) is written for vanilla Zustand. When applying its guidance:

- **Use the structural advice** (scoped-store-via-Context, atomic selectors, middleware order, action-organisation patterns, v5 breaking-change notes) — these all apply.
- **Substitute the API surface**: replace every `create<T>()(...)` example with `createStore(state, options)`; replace every `useStore(selector)` with the appropriate `useTracked*` hook.
- **Skip middleware-stacking guidance** — it assumes nested HOFs (`devtools(persist(...))`); the wrapper's option bag handles ordering internally.
- **Skip `useShallow` and atomic-selector guidance** — `useTracked*` proxy-tracks accessed keys automatically, so multi-value reads do not need `useShallow` or hand-written equality functions.

If a pattern from the skill cannot be expressed through `zustand-x`, that's a signal to either drop the wrapper for that store or add the gap to this file.
