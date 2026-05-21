import { Map, Set } from "immutable";
import { afterAll, beforeAll, beforeEach, expect, vi } from "vitest";

import { FakeTimerRegistry } from "../fake-timer-registry";

/**
 * State probe — stateless dispatcher.
 *
 * All state lives in closures inside `trackLeaksInSpec` (per-spec snapshots,
 * concurrent-test latch) or in the setup-owned `FakeTimerRegistry` (file-exit
 * cross-spec fake-timer detection). The helper module itself holds no
 * module-level state, satisfying the helper dispatcher contract under
 * `isolate: false`.
 */

interface StateSnapshot {
  activeResources: Map<string, number>;
  fakeTimers: boolean;
  globalKeys: Set<string | symbol>;
  processListeners: Map<string | symbol, number>;
}

const snapshotState = (): StateSnapshot => {
  const globalKeys = Set<string | symbol>(Reflect.ownKeys(globalThis));

  const processListeners = Map<string | symbol, number>(
    process.eventNames().map((name) => [name, process.listenerCount(name)]),
  );

  const activeResources = process
    .getActiveResourcesInfo()
    .reduce(
      (acc, resource) => acc.set(resource, (acc.get(resource) ?? 0) + 1),
      Map<string, number>(),
    );

  return {
    activeResources,
    // `vi.setSystemTime` mocks the global `Date` without flipping
    // `isFakeTimers()`; `getMockedSystemTime()` is the documented signal that
    // covers both flavours.
    fakeTimers: vi.isFakeTimers() || vi.getMockedSystemTime() !== null,
    globalKeys,
    processListeners,
  };
};

const diffKeys = (
  label: string,
  before: Set<string | symbol>,
  after: Set<string | symbol>,
): string[] => {
  const lines: string[] = [];

  for (const key of after) {
    if (!before.has(key)) {
      lines.push(`${label}+${String(key)}`);
    }
  }

  for (const key of before) {
    if (!after.has(key)) {
      lines.push(`${label}-${String(key)}`);
    }
  }

  return lines;
};

const diffCounts = (
  label: string,
  before: Map<string | symbol, number>,
  after: Map<string | symbol, number>,
): string[] => {
  const lines: string[] = [];
  const keys = Set([...before.keys(), ...after.keys()]);

  for (const key of keys) {
    const beforeCount = before.get(key) ?? 0;
    const afterCount = after.get(key) ?? 0;

    if (beforeCount !== afterCount) {
      lines.push(`${label}.${String(key)}=${beforeCount}->${afterCount}`);
    }
  }

  return lines;
};

const diffSnapshots = (
  before: StateSnapshot,
  after: StateSnapshot,
): string[] => {
  const lines = [
    ...diffKeys("globalThis", before.globalKeys, after.globalKeys),
    ...diffCounts("process", before.processListeners, after.processListeners),
    ...diffCounts("active", before.activeResources, after.activeResources),
  ];

  if (before.fakeTimers !== after.fakeTimers) {
    lines.push(`fakeTimers=${before.fakeTimers}->${after.fakeTimers}`);
  }

  return lines;
};

const trackLeaksInSpec = (specName: string): void => {
  if (process.env.DEBUG_TEST_POLLUTION !== "1") {
    return;
  }

  let fileBaseline: StateSnapshot;
  let filePath: string | null = null;

  beforeAll(() => {
    fileBaseline = snapshotState();
    // `testPath` is a Jest-compat surface on `expect.getState()`; reverify presence on Vitest major bumps.
    filePath = expect.getState().testPath ?? null;
  });

  beforeEach(({ onTestFinished, task }) => {
    const testBaseline = snapshotState();

    onTestFinished(() => {
      const after = snapshotState();
      const diffs = diffSnapshots(testBaseline, after);

      if (diffs.length > 0) {
        process.stderr.write(
          `[LEAK ${specName} > ${task.name}] ${diffs.join(" ")}\n`,
        );
      }

      // Pattern A (clock-fix via `setSystemTime` + `useRealTimers()` cleanup)
      // is permitted under concurrent execution — sibling tests converge on
      // the same fixed clock. Pattern B (advancing the shared clock) breaks
      // siblings' pending timers; only that signal is treated as a risk.
      const fileAdvancedTimers =
        filePath !== null &&
        FakeTimerRegistry.didFileAdvanceFakeTimers(filePath);

      if (task.concurrent && fileAdvancedTimers) {
        process.stderr.write(
          `[RISK ${specName} > ${task.name}] concurrent test advanced fake timers — sibling tests share the clock\n`,
        );
      }
    });
  });

  afterAll(() => {
    const diffs = diffSnapshots(fileBaseline, snapshotState());

    if (diffs.length > 0) {
      process.stderr.write(
        `[LEAK ${specName} <file-exit>] ${diffs.join(" ")}\n`,
      );
    }

    const fileAdvancedTimers =
      filePath !== null && FakeTimerRegistry.didFileAdvanceFakeTimers(filePath);

    if (fileAdvancedTimers) {
      process.stderr.write(
        `[RISK ${specName} <file-exit>] fake timers were advanced in this spec — under concurrent execution sibling tests share the clock. Apply .sequential to opt out.\n`,
      );
    }

    if (filePath !== null) {
      FakeTimerRegistry.clearFakeTimerFile(filePath);
    }
  });
};

const StateProbeHelper = Object.freeze({
  trackLeaksInSpec,
} as const);

export { StateProbeHelper };
