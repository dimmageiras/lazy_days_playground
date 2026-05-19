import { AsyncLocalStorage } from "node:async_hooks";

import { MapHelper } from "@shared/helpers/map.helper";

const { getMapValue } = MapHelper;

interface ScopeSlot<TValue> {
  value: TValue;
}

interface GlobalThisScope<TValue> {
  run: <TResult>(
    initial: TValue,
    fn: () => Promise<TResult>,
  ) => Promise<TResult>;
}

const scopes = new Map<
  keyof typeof globalThis,
  GlobalThisScope<(typeof globalThis)[keyof typeof globalThis]>
>();

const installScope = <TKey extends keyof typeof globalThis>(
  key: TKey,
): GlobalThisScope<(typeof globalThis)[TKey]> => {
  const storage = new AsyncLocalStorage<ScopeSlot<(typeof globalThis)[TKey]>>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);

  if (!descriptor?.get) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get: () => storage.getStore()?.value,
      set: (value: (typeof globalThis)[TKey]) => {
        const store = storage.getStore();

        if (store) {
          store.value = value;
        }
      },
    });
  }

  return {
    run: <TResult>(
      initial: (typeof globalThis)[TKey],
      fn: () => Promise<TResult>,
    ): Promise<TResult> => storage.run({ value: initial }, fn),
  };
};

const createGlobalThisScope = <TKey extends keyof typeof globalThis>(
  key: TKey,
): GlobalThisScope<(typeof globalThis)[TKey]> => {
  const existing: GlobalThisScope<(typeof globalThis)[TKey]> | undefined =
    getMapValue(scopes, key);

  if (existing) {
    return existing;
  }

  const scope = installScope(key);

  scopes.set(key, scope);

  return scope;
};

const GlobalThisScopeHelper = Object.freeze({
  createGlobalThisScope,
} as const);

export { GlobalThisScopeHelper };
