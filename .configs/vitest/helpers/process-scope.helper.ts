import { AsyncLocalStorage } from "node:async_hooks";
import { vi } from "vitest";

type ProcessMethodKey =
  | {
      [TKey in keyof typeof process]-?: NonNullable<
        (typeof process)[TKey]
      > extends (...args: unknown[]) => unknown
        ? TKey
        : never;
    }[keyof typeof process]
  | "exit"
  | "kill";

type ProcessFn<TKey extends ProcessMethodKey> = NonNullable<
  (typeof process)[TKey]
>;

interface ScopeSlot<TFn> {
  impl: TFn;
}

interface ProcessScope<TFn> {
  run: <TResult>(impl: TFn, fn: () => Promise<TResult>) => Promise<TResult>;
}

type ScopeRegistry = {
  [TKey in ProcessMethodKey]?: ProcessScope<ProcessFn<TKey>>;
};

const scopes: ScopeRegistry = {};

const installScope = <TKey extends ProcessMethodKey>(
  key: TKey,
): ProcessScope<ProcessFn<TKey>> => {
  const storage = new AsyncLocalStorage<ScopeSlot<ProcessFn<TKey>>>();
  const spy = vi.spyOn(process, key);

  // Refuse silent fallback to the real `process.<key>` when a test calls it
  // outside `run(...)`: the real `exit` would kill the test runner, the real
  // `kill` would signal a real PID. Tests must wrap every call in `run(impl)`.
  const router = (
    ...args: Parameters<ProcessFn<TKey>>
  ): ReturnType<ProcessFn<TKey>> => {
    const slot = storage.getStore();

    if (!slot) {
      throw new Error(
        `process.${String(key)} called outside run() scope. Wrap the call in createProcessScope("${String(key)}").run(impl, ...).`,
      );
    }

    const { impl } = slot;
    const result: ReturnType<ProcessFn<TKey>> = Reflect.apply(
      impl,
      undefined,
      args,
    );

    return result;
  };

  Reflect.apply(spy.mockImplementation, spy, [router]);

  return {
    run: <TResult>(
      impl: ProcessFn<TKey>,
      fn: () => Promise<TResult>,
    ): Promise<TResult> => storage.run({ impl }, fn),
  };
};

const createProcessScope = <TKey extends ProcessMethodKey>(
  key: TKey,
): ProcessScope<ProcessFn<TKey>> => {
  const existing: ScopeRegistry[TKey] = Reflect.get(scopes, key);

  if (existing) {
    return existing;
  }

  const scope = installScope(key);

  Reflect.set(scopes, key, scope);

  return scope;
};

const ProcessScopeHelper = Object.freeze({
  createProcessScope,
} as const);

export { ProcessScopeHelper };
