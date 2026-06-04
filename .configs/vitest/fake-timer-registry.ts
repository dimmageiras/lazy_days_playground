import { vi } from "vitest";

import { SetHelper } from "@shared/helpers/set.helper";

import { FunctionWrapHelper } from "./function-wrap.helper";

const { wrapWithCallback } = FunctionWrapHelper;
const { addValuesInPlace, hasSetValue, stripValuesInPlace } = SetHelper;

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
  // Explicit per-method assignments (no dynamic indexing on `vi`) keep the
  // wrap list auditable; `wrapWithCallback` factors the record/forward body.

  vi.advanceTimersByTime = wrapWithCallback(
    vi.advanceTimersByTime.bind(vi),
    recordCurrentFile,
  );

  vi.advanceTimersByTimeAsync = wrapWithCallback(
    vi.advanceTimersByTimeAsync.bind(vi),
    recordCurrentFile,
  );

  vi.advanceTimersToNextTimer = wrapWithCallback(
    vi.advanceTimersToNextTimer.bind(vi),
    recordCurrentFile,
  );

  vi.advanceTimersToNextTimerAsync = wrapWithCallback(
    vi.advanceTimersToNextTimerAsync.bind(vi),
    recordCurrentFile,
  );

  vi.advanceTimersToNextFrame = wrapWithCallback(
    vi.advanceTimersToNextFrame.bind(vi),
    recordCurrentFile,
  );

  vi.runAllTimers = wrapWithCallback(
    vi.runAllTimers.bind(vi),
    recordCurrentFile,
  );

  vi.runAllTimersAsync = wrapWithCallback(
    vi.runAllTimersAsync.bind(vi),
    recordCurrentFile,
  );

  vi.runAllTicks = wrapWithCallback(vi.runAllTicks.bind(vi), recordCurrentFile);

  vi.runOnlyPendingTimers = wrapWithCallback(
    vi.runOnlyPendingTimers.bind(vi),
    recordCurrentFile,
  );

  vi.runOnlyPendingTimersAsync = wrapWithCallback(
    vi.runOnlyPendingTimersAsync.bind(vi),
    recordCurrentFile,
  );
};

const recordFakeTimerFile = (filePath: string): void => {
  addValuesInPlace(clockAdvanceFilePaths, [filePath]);
};

const didFileAdvanceFakeTimers = (filePath: string): boolean => {
  return hasSetValue(clockAdvanceFilePaths, filePath);
};

const clearFakeTimerFile = (filePath: string): void => {
  stripValuesInPlace(clockAdvanceFilePaths, [filePath]);
};

const FakeTimerRegistry = Object.freeze({
  clearFakeTimerFile,
  didFileAdvanceFakeTimers,
  installHijack,
  recordFakeTimerFile,
} as const);

export { FakeTimerRegistry };
