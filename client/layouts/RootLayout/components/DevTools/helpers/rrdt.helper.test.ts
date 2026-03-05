import type { ExpectStatic } from "vitest";
import { describe, vi } from "vitest";

import { devToolsStore } from "@client/layouts/RootLayout/components/DevTools/stores/dev-tools.store";

import {
  triggerObserver,
  withMutationObserverMock,
} from "./dev-tools.helper.test";
import { RRDTHelper } from "./rrdt.helper";

const { observeDevToolsPanel } = RRDTHelper;

// Test data constants
const TEST_DATA = {
  PANEL_SELECTOR: "#rrdt-panel",
  PANEL_OPEN: '<div id="rrdt-panel" tabindex="0"></div>',
  PANEL_COLLAPSED: '<div id="rrdt-panel" tabindex="-1"></div>',
  EMPTY_DOM: "",
} as const;

const runPanelCase = (
  expect: ExpectStatic,
  html: string,
  expectedState?: boolean,
  shouldVerifyObserve = false,
) => {
  withMutationObserverMock(({ observe, disconnect, callbackRef }) => {
    const setSpy = vi.spyOn(devToolsStore, "set");

    try {
      document.body.innerHTML = html;

      if (expectedState === undefined) {
        devToolsStore.set("isRRDTOpen", false);
        setSpy.mockClear();
      } else {
        devToolsStore.set("isRRDTOpen", !expectedState);
      }

      const cleanup = observeDevToolsPanel(TEST_DATA.PANEL_SELECTOR);

      triggerObserver(callbackRef);

      if (expectedState === undefined) {
        expect(setSpy).not.toHaveBeenCalled();
      } else {
        expect(setSpy).toHaveBeenCalledWith("isRRDTOpen", expectedState);
      }

      if (shouldVerifyObserve) {
        expect(observe).toHaveBeenCalledWith(document.body, {
          attributeFilter: ["tabindex"],
          attributes: true,
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

describe("RRDTHelper", () => {
  describe("observeDevToolsPanel", (it) => {
    it("should set store when panel is open", ({ expect }) => {
      runPanelCase(expect, TEST_DATA.PANEL_OPEN, true, true);
    });

    it("should set store when panel is collapsed", ({ expect }) => {
      runPanelCase(expect, TEST_DATA.PANEL_COLLAPSED, false);
    });

    it("should ignore missing panel elements", ({ expect }) => {
      runPanelCase(expect, TEST_DATA.EMPTY_DOM);
    });
  });
});
