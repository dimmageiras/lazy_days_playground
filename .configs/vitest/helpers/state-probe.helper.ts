import { afterAll, beforeAll, beforeEach, expect, vi } from "vitest";

import { SetHelper } from "@shared/helpers/set.helper";

import { FakeTimerRegistry } from "../fake-timer-registry";

const { hasSetValue } = SetHelper;

const { clearFakeTimerFile, didFileAdvanceFakeTimers } = FakeTimerRegistry;

interface StateSnapshot {
  activeResources: Map<string, number>;
  fakeTimers: boolean;
  globalKeys: Set<string | symbol>;
  processListeners: Map<string | symbol, number>;
}

const snapshotState = (): StateSnapshot => {
  const globalKeys = new Set<string | symbol>(Reflect.ownKeys(globalThis));

  const processListeners = new Map<string | symbol, number>(
    process.eventNames().map((name) => [name, process.listenerCount(name)]),
  );

  const activeResources = process
    .getActiveResourcesInfo()
    .reduce(
      (resourceCounts, resource) =>
        resourceCounts.set(resource, (resourceCounts.get(resource) ?? 0) + 1),
      new Map<string, number>(),
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
): Array<string> => {
  const lines: Array<string> = [];

  for (const key of after) {
    if (!hasSetValue(before, key)) {
      lines.push(`${label}+${String(key)}`);
    }
  }

  for (const key of before) {
    if (!hasSetValue(after, key)) {
      lines.push(`${label}-${String(key)}`);
    }
  }

  return lines;
};

const diffCounts = (
  label: string,
  before: Map<string | symbol, number>,
  after: Map<string | symbol, number>,
): Array<string> => {
  const lines: Array<string> = [];
  const keys = new Set([...before.keys(), ...after.keys()]);

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
): Array<string> => {
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

    if (filePath === null) {
      process.stderr.write(
        `[WARN ${specName} <file-init>] expect.getState().testPath was undefined — fake-timer attribution and registry cleanup will not run for this spec.\n`,
      );
    }
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
        filePath !== null && didFileAdvanceFakeTimers(filePath);

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
      filePath !== null && didFileAdvanceFakeTimers(filePath);

    if (fileAdvancedTimers) {
      process.stderr.write(
        `[RISK ${specName} <file-exit>] fake timers were advanced in this spec — under concurrent execution sibling tests share the clock. Hoist the clock to beforeAll/afterAll or use a deterministic-clock pattern that does not advance the shared fake timer.\n`,
      );
    }

    if (filePath !== null) {
      clearFakeTimerFile(filePath);
    }
  });
};

const StateProbeHelper = Object.freeze({
  trackLeaksInSpec,
} as const);

export { StateProbeHelper };
