import { renderHook } from "@testing-library/react";
import { beforeEach, describe, vi } from "vitest";

import { TIMING } from "@shared/constants/timing.constant";

import { useDebounce } from "./useDebounce";

describe("useDebounce", (it) => {
  const { SECONDS_ONE_IN_MS, SECONDS_HALF_IN_MS } = TIMING;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("executes callback after the specified delay", ({ expect }) => {
    const callback = vi.fn();
    const delay = SECONDS_ONE_IN_MS;

    const { result } = renderHook(() => useDebounce(callback, delay));
    const debouncedCallback = result.current;

    debouncedCallback();

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(delay);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith();
  });

  it("resets the timer when called multiple times", ({ expect }) => {
    const callback = vi.fn();
    const delay = SECONDS_ONE_IN_MS;

    const { result } = renderHook(() => useDebounce(callback, delay));
    const debouncedCallback = result.current;

    debouncedCallback();
    vi.advanceTimersByTime(delay - 100);
    expect(callback).not.toHaveBeenCalled();

    debouncedCallback(); // Reset timer
    vi.advanceTimersByTime(delay - 100);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("passes arguments correctly to the callback", ({ expect }) => {
    const callback = vi.fn();
    const delay = SECONDS_HALF_IN_MS;

    const { result } = renderHook(() => useDebounce(callback, delay));
    const debouncedCallback = result.current;

    debouncedCallback("arg1", 42, { key: "value" });

    vi.advanceTimersByTime(delay);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("arg1", 42, { key: "value" });
  });

  it("clears timeout on unmount", ({ expect }) => {
    const callback = vi.fn();
    const delay = SECONDS_ONE_IN_MS;

    const { result, unmount } = renderHook(() => useDebounce(callback, delay));
    const debouncedCallback = result.current;

    debouncedCallback();

    unmount();

    vi.advanceTimersByTime(delay);

    expect(callback).not.toHaveBeenCalled();
  });

  it("handles callback updates correctly", ({ expect }) => {
    const initialCallback = vi.fn();
    const updatedCallback = vi.fn();
    const delay = SECONDS_HALF_IN_MS;

    const { result, rerender } = renderHook(
      ({ callback }) => useDebounce(callback, delay),
      { initialProps: { callback: initialCallback } }
    );

    const debouncedCallback = result.current;

    debouncedCallback();
    vi.advanceTimersByTime(delay / 2);

    rerender({ callback: updatedCallback });

    vi.advanceTimersByTime(delay / 2);

    expect(initialCallback).not.toHaveBeenCalled();
    expect(updatedCallback).toHaveBeenCalledTimes(1);
  });

  it("works with different delay values", ({ expect }) => {
    const callback = vi.fn();
    const shortDelay = SECONDS_HALF_IN_MS;
    const longDelay = SECONDS_ONE_IN_MS;

    const { result: shortResult, rerender } = renderHook(
      () => useDebounce(callback, shortDelay),
      { initialProps: {} }
    );

    const shortDebounced = shortResult.current;

    shortDebounced();

    vi.advanceTimersByTime(shortDelay);
    expect(callback).toHaveBeenCalledTimes(1);

    // Test with longer delay
    rerender({ delay: longDelay });
    const longDebounced = shortResult.current; // Same reference after rerender

    longDebounced();

    vi.advanceTimersByTime(longDelay);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("handles async callbacks", async ({ expect }) => {
    const asyncCallback = vi.fn().mockResolvedValue(undefined);
    const delay = SECONDS_HALF_IN_MS;

    const { result } = renderHook(() => useDebounce(asyncCallback, delay));
    const debouncedCallback = result.current;

    debouncedCallback();

    vi.advanceTimersByTime(delay);

    expect(asyncCallback).toHaveBeenCalledTimes(1);
    expect(asyncCallback).toHaveBeenCalledWith();
  });

  it("does not execute callback if component is unmounted before delay", ({
    expect,
  }) => {
    const callback = vi.fn();
    const delay = SECONDS_ONE_IN_MS;

    const { result, unmount } = renderHook(() => useDebounce(callback, delay));
    const debouncedCallback = result.current;

    debouncedCallback();

    vi.advanceTimersByTime(delay / 2);
    unmount();

    vi.advanceTimersByTime(delay / 2);

    expect(callback).not.toHaveBeenCalled();
  });

  it("returns the same function reference across renders with same delay", ({
    expect,
  }) => {
    const callback = vi.fn();
    const delay = SECONDS_ONE_IN_MS;

    const { result, rerender } = renderHook(() => useDebounce(callback, delay));

    const firstReference = result.current;

    rerender();

    const secondReference = result.current;

    expect(firstReference).toBe(secondReference);
  });
});
