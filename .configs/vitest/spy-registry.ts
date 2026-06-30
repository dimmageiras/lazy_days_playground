import type { MockInstance } from "vitest";
import { expect, vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

const { castAsType } = TypeHelper;

interface SpyEntry {
  key: PropertyKey;
  spy: MockInstance;
  target: object;
}

// A `vi.spyOn` on a shared or global object (e.g. `process.kill`) replaces a
// slot on a worker-global object. Under `isolate: false` that replacement
// outlives the file unless the spy is restored, stubbing the object for every
// later file. Keyed by the file that created the spy so each file is judged at
// its own exit; cleared once reported.
const spiesByFile = new Map<string, Array<SpyEntry>>();
let hijacked = false;

// Wrap `vi.spyOn` so every spy is recorded against the file that created it.
// Spies are created during test execution (hooks/tests), after this install in
// setup, so — unlike a mock built in a `vi.hoisted` factory — none escape the
// hijack. Idempotent: one install per worker.
const installSpyHijack = (): void => {
  if (hijacked) {
    return;
  }

  hijacked = true;

  const originalSpyOn = castAsType<
    (target: object, key: PropertyKey, ...rest: Array<unknown>) => MockInstance
  >(vi.spyOn);

  vi.spyOn = castAsType<typeof vi.spyOn>(
    (
      target: object,
      key: PropertyKey,
      ...rest: Array<unknown>
    ): MockInstance => {
      const spy = originalSpyOn(target, key, ...rest);

      // `testPath` is a Jest-compat surface on `expect.getState()`; reverify on
      // Vitest major bumps. Same per-file key the fake-timer hijack uses.
      const { testPath } = expect.getState();

      if (typeof testPath === "string") {
        const entries = spiesByFile.get(testPath) ?? [];

        entries.push({ key, spy, target });
        spiesByFile.set(testPath, entries);
      }

      return spy;
    },
  );
};

// A spy whose target slot still holds the spy at file exit was never restored:
// `mockRestore`/`restoreAllMocks` put the original back (or delete the added own
// property), but `mockReset`/`mockClear` leave the spy installed — that slot
// leaks into the next file. Inspect the descriptor, not the read value: a
// method spy sits in `descriptor.value`, an accessor spy in `descriptor.get` /
// `.set`, and reading an accessor through its value would *invoke* the mocked
// getter inside this hook.
const isSpyInstalled = ({ key, spy, target }: SpyEntry): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  const installed = castAsType<unknown>(spy);

  return (
    descriptor !== undefined &&
    (descriptor.value === installed ||
      descriptor.get === installed ||
      descriptor.set === installed)
  );
};

// Re-spying a slot reuses the same spy, so several recorded entries can point at
// one live spy — dedupe the reported keys.
const collectLeakedSpies = (filePath: string): Array<string> =>
  Array.from(
    new Set(
      (spiesByFile.get(filePath) ?? [])
        .filter(isSpyInstalled)
        .map(({ key }) => `spy.${String(key)}=not-restored`),
    ),
  );

const clearSpiesForFile = (filePath: string): void => {
  spiesByFile.delete(filePath);
};

const SpyRegistry = Object.freeze({
  clearSpiesForFile,
  collectLeakedSpies,
  installSpyHijack,
} as const);

export { SpyRegistry };
