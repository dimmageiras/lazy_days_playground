import type { ExpectStatic } from "vitest";
import { describe, vi } from "vitest";

import { devToolsStore } from "@client/layouts/RootLayout/components/DevTools/stores/dev-tools.store";
import { TypeHelper } from "@shared/helpers/type.helper";

import { TQDTHelper } from "./tqdt.helper";

const { observeDevToolsPanel, observeDuplicateButtons } = TQDTHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  PANEL_SELECTOR: "#rqdt-panel",
  PANEL_PRESENT: '<div id="rqdt-panel"></div>',
  PANEL_MISSING: "",
  CONTAINER_SELECTOR: "#rqdt-container",
  CONTAINER_ONE: '<div id="rqdt-container"><button></button></div>',
  CONTAINER_MULTI:
    '<div id="rqdt-container"><button></button><button></button><button></button></div>',
  CONTAINER_MISSING: "",
} as const;

const withMutationObserverMock = (
  run: (ctx: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    trigger: () => void;
  }) => void,
) => {
  const originalMutationObserver = globalThis.MutationObserver;
  const observe = vi.fn();
  const disconnect = vi.fn();
  let callback: MutationCallback | null = null;

  class MutationObserverMock {
    constructor(nextCallback: MutationCallback) {
      callback = nextCallback;
    }

    observe = observe;
    disconnect = disconnect;
  }

  try {
    globalThis.MutationObserver =
      castAsType<typeof MutationObserver>(MutationObserverMock);
    run({
      observe,
      disconnect,
      trigger: () => {
        castAsType<MutationCallback>(callback)?.(
          [],
          castAsType<MutationObserver>({}),
        );
      },
    });
  } finally {
    globalThis.MutationObserver = originalMutationObserver;
    document.body.innerHTML = "";
  }
};

const runPanelCase = (
  expect: ExpectStatic,
  html: string,
  expectedState: boolean,
  shouldVerifyObserve = false,
) => {
  withMutationObserverMock(({ observe, disconnect, trigger }) => {
    const setSpy = vi.spyOn(devToolsStore, "set");

    try {
      document.body.innerHTML = html;
      devToolsStore.set("isRQDTOpen", !expectedState);
      setSpy.mockClear();

      const cleanup = observeDevToolsPanel(TEST_DATA.PANEL_SELECTOR);

      trigger();

      expect(setSpy).toHaveBeenCalledWith("isRQDTOpen", expectedState);

      if (shouldVerifyObserve) {
        expect(observe).toHaveBeenCalledWith(document.body, {
          childList: true,
          subtree: true,
        });
      }

      expect(() => cleanup()).not.toThrow();
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      setSpy.mockRestore();
    }
  });
};

const runDuplicateCase = (
  expect: ExpectStatic,
  html: string,
  expectedButtons: number | null,
  shouldObserve: boolean,
) => {
  withMutationObserverMock(({ observe, disconnect, trigger }) => {
    document.body.innerHTML = html;

    const container = document.querySelector(TEST_DATA.CONTAINER_SELECTOR);
    const cleanup = observeDuplicateButtons(TEST_DATA.CONTAINER_SELECTOR);

    trigger();

    if (expectedButtons === null) {
      expect(container).toBeNull();
    } else {
      expect(container?.children.length).toBe(expectedButtons);
    }

    if (shouldObserve) {
      expect(observe).toHaveBeenCalledWith(container, {
        childList: true,
        subtree: true,
      });
    } else {
      expect(observe).not.toHaveBeenCalled();
    }

    expect(() => cleanup()).not.toThrow();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
};

describe("TQDTHelper", () => {
  describe("observeDevToolsPanel", (it) => {
    it("should set store to true when panel is present", ({ expect }) => {
      runPanelCase(expect, TEST_DATA.PANEL_PRESENT, true, true);
    });

    it("should set store to false when panel is missing", ({ expect }) => {
      runPanelCase(expect, TEST_DATA.PANEL_MISSING, false);
    });
  });

  describe("observeDuplicateButtons", (it) => {
    it("should remove duplicate buttons", ({ expect }) => {
      runDuplicateCase(expect, TEST_DATA.CONTAINER_MULTI, 1, true);
    });

    it("should keep a single button intact", ({ expect }) => {
      runDuplicateCase(expect, TEST_DATA.CONTAINER_ONE, 1, true);
    });

    it("should ignore missing container", ({ expect }) => {
      runDuplicateCase(expect, TEST_DATA.CONTAINER_MISSING, null, false);
    });

    it("should skip non-element buttons", ({ expect }) => {
      withMutationObserverMock(({ observe, disconnect, trigger }) => {
        const buttonOne = document.createElement("button");
        const buttonTwo = document.createElement("button");
        const nonElementButton = { remove: vi.fn() };
        const container = castAsType<Element>({
          children: [buttonOne, nonElementButton, buttonTwo],
        });
        const querySpy = vi
          .spyOn(document, "querySelector")
          .mockReturnValue(container);
        const removeSpyOne = vi.spyOn(buttonOne, "remove");
        const removeSpyTwo = vi.spyOn(buttonTwo, "remove");

        try {
          const cleanup = observeDuplicateButtons(TEST_DATA.CONTAINER_SELECTOR);

          trigger();

          expect(removeSpyOne).not.toHaveBeenCalled();
          expect(nonElementButton.remove).not.toHaveBeenCalled();
          expect(removeSpyTwo).toHaveBeenCalledTimes(1);
          expect(observe).toHaveBeenCalledWith(container, {
            childList: true,
            subtree: true,
          });
          expect(() => cleanup()).not.toThrow();
          expect(disconnect).toHaveBeenCalledTimes(1);
        } finally {
          querySpy.mockRestore();
        }
      });
    });
  });
});
