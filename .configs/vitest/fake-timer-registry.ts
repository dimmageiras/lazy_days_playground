import { vi } from "vitest";

// Pattern B (clock-advance): any call that flushes pending timers against the
// shared fake clock. Pattern A (`setSystemTime` + `useRealTimers()` cleanup)
// is concurrency-safe and is deliberately not tracked.
const clockAdvanceFilePaths = new Set<string>();
let hijacked = false;

const installHijack = (recordCurrentFile: () => void): void => {
  if (hijacked) {
    return;
  }

  hijacked = true;

  // Advance-class methods (Pattern B). Flushing pending timers against a
  // shared fake clock affects sibling concurrent tests — hijack each entry
  // point so file attribution catches whichever the test chose.
  //
  // Explicit assignments avoid dynamic property indexing on the `vi` object.

  const originalAdvanceTimersByTime = vi.advanceTimersByTime.bind(vi);

  vi.advanceTimersByTime = (ms) => {
    recordCurrentFile();

    return originalAdvanceTimersByTime(ms);
  };

  const originalAdvanceTimersByTimeAsync =
    vi.advanceTimersByTimeAsync.bind(vi);

  vi.advanceTimersByTimeAsync = (ms) => {
    recordCurrentFile();

    return originalAdvanceTimersByTimeAsync(ms);
  };

  const originalAdvanceTimersToNextTimer =
    vi.advanceTimersToNextTimer.bind(vi);

  vi.advanceTimersToNextTimer = () => {
    recordCurrentFile();

    return originalAdvanceTimersToNextTimer();
  };

  const originalAdvanceTimersToNextTimerAsync =
    vi.advanceTimersToNextTimerAsync.bind(vi);

  vi.advanceTimersToNextTimerAsync = () => {
    recordCurrentFile();

    return originalAdvanceTimersToNextTimerAsync();
  };

  const originalAdvanceTimersToNextFrame =
    vi.advanceTimersToNextFrame.bind(vi);

  vi.advanceTimersToNextFrame = () => {
    recordCurrentFile();

    return originalAdvanceTimersToNextFrame();
  };

  const originalRunAllTimers = vi.runAllTimers.bind(vi);

  vi.runAllTimers = () => {
    recordCurrentFile();

    return originalRunAllTimers();
  };

  const originalRunAllTimersAsync = vi.runAllTimersAsync.bind(vi);

  vi.runAllTimersAsync = () => {
    recordCurrentFile();

    return originalRunAllTimersAsync();
  };

  const originalRunAllTicks = vi.runAllTicks.bind(vi);

  vi.runAllTicks = () => {
    recordCurrentFile();

    return originalRunAllTicks();
  };

  const originalRunOnlyPendingTimers = vi.runOnlyPendingTimers.bind(vi);

  vi.runOnlyPendingTimers = () => {
    recordCurrentFile();

    return originalRunOnlyPendingTimers();
  };

  const originalRunOnlyPendingTimersAsync =
    vi.runOnlyPendingTimersAsync.bind(vi);

  vi.runOnlyPendingTimersAsync = () => {
    recordCurrentFile();

    return originalRunOnlyPendingTimersAsync();
  };
};

const recordFakeTimerFile = (filePath: string): void => {
  clockAdvanceFilePaths.add(filePath);
};

const didFileAdvanceFakeTimers = (filePath: string): boolean => {
  return clockAdvanceFilePaths.has(filePath);
};

const clearFakeTimerFile = (filePath: string): void => {
  clockAdvanceFilePaths.delete(filePath);
};

const FakeTimerRegistry = Object.freeze({
  clearFakeTimerFile,
  didFileAdvanceFakeTimers,
  installHijack,
  recordFakeTimerFile,
} as const);

export { FakeTimerRegistry };
