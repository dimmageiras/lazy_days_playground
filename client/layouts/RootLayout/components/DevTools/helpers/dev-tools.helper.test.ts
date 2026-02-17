import { describe, vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { DevToolsHelper } from "./dev-tools.helper";

const { createObserverCleanup, setupDevToolsButton } = DevToolsHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  BUTTON_SELECTOR: "button",
  CONTAINER_SELECTOR: "div",
  FULL_DOM: '<div id="container"></div><button id="button"></button>',
  EMPTY_DOM: "",
} as const;

const setupDom = (html: string) => {
  document.body.innerHTML = html;
};

const triggerObserver = (callbackRef: { current: MutationCallback | null }) => {
  castAsType<MutationCallback>(callbackRef.current)?.(
    [],
    castAsType<MutationObserver>({}),
  );
};

const withMutationObserverMock = (
  run: (ctx: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    callbackRef: { current: MutationCallback | null };
  }) => void,
) => {
  const originalMutationObserver = globalThis.MutationObserver;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const callbackRef = { current: null as MutationCallback | null };

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

describe("DevToolsHelper", () => {
  describe("createObserverCleanup", (it) => {
    it("should create an observer cleanup function", ({ expect }) => {
      const disconnect = vi.fn();
      const observer = castAsType<MutationObserver>({ disconnect });
      let result: void | undefined;

      expect(() => {
        result = createObserverCleanup(observer);
      }).not.toThrow();
      expect(result).toBeUndefined();
      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it("should handle a null observer", ({ expect }) => {
      expect(() => createObserverCleanup(null)).not.toThrow();
      expect(createObserverCleanup(null)).toBeUndefined();
    });
  });

  describe("setupDevToolsButton", (it) => {
    it("should setup a dev tools button", ({ expect }) => {
      withMutationObserverMock(({ observe, disconnect, callbackRef }) => {
        setupDom(TEST_DATA.FULL_DOM);

        const cleanup = setupDevToolsButton(
          TEST_DATA.BUTTON_SELECTOR,
          TEST_DATA.CONTAINER_SELECTOR,
        );

        triggerObserver(callbackRef);
        const container = document.querySelector("#container");

        expect(cleanup).toBeDefined();
        expect(container?.querySelector("#button")).toBeDefined();
        expect(observe).toHaveBeenCalledWith(document.body, {
          childList: true,
          subtree: true,
        });
        expect(disconnect).toHaveBeenCalledTimes(1);
        expect(() => cleanup()).not.toThrow();
        expect(disconnect).toHaveBeenCalledTimes(2);
      });
    });

    it("should not move button when button and container are missing", ({
      expect,
    }) => {
      withMutationObserverMock(({ observe, disconnect, callbackRef }) => {
        setupDom(TEST_DATA.EMPTY_DOM);

        const cleanup = setupDevToolsButton(
          TEST_DATA.BUTTON_SELECTOR,
          TEST_DATA.CONTAINER_SELECTOR,
        );

        triggerObserver(callbackRef);

        expect(observe).toHaveBeenCalledWith(document.body, {
          childList: true,
          subtree: true,
        });
        expect(disconnect).not.toHaveBeenCalled();
        expect(() => cleanup()).not.toThrow();
        expect(disconnect).toHaveBeenCalledTimes(1);
      });
    });
  });
});
