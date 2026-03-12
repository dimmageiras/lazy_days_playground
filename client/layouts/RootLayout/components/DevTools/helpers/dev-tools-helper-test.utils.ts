import { vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

const { castAsType } = TypeHelper;

/**
 * Triggers the MutationObserver callback captured by withMutationObserverMock.
 * Used by DevTools helper tests to simulate a mutation and run the callback.
 */
const triggerObserver = (callbackRef: {
  current: MutationCallback | null;
}): void => {
  castAsType<MutationCallback>(callbackRef.current)?.(
    [],
    castAsType<MutationObserver>({}),
  );
};

/**
 * Replaces global MutationObserver with a mock that captures the callback
 * and exposes observe/disconnect spies. Restores the original in finally.
 * Used by dev-tools.helper.test and rrdt.helper.test.
 */
const withMutationObserverMock = (
  run: (ctx: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    callbackRef: { current: MutationCallback | null };
  }) => void,
): void => {
  const originalMutationObserver = globalThis.MutationObserver;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const callbackRef = castAsType<{ current: MutationCallback | null }>({
    current: null,
  });

  class MutationObserverMock {
    constructor(callback: MutationCallback) {
      callbackRef.current = callback;
    }

    observe = observe;
    disconnect = disconnect;
  }

  try {
    globalThis.MutationObserver =
      castAsType<typeof MutationObserver>(MutationObserverMock);
    run({ observe, disconnect, callbackRef });
  } finally {
    globalThis.MutationObserver = originalMutationObserver;
    document.body.innerHTML = "";
  }
};

export { triggerObserver, withMutationObserverMock };
