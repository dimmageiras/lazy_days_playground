import { describe } from "vitest";

import { ClickOutsideHelper } from "./click-outside.helper";

describe("ClickOutsideHelper", () => {
  describe("getEventTarget", (it) => {
    it("returns event target when event has target", ({ expect }) => {
      const mockTarget = document.createElement("div");
      const mockEvent = new MouseEvent("click");

      Object.defineProperty(mockEvent, "target", { value: mockTarget });

      const result = ClickOutsideHelper.getEventTarget(mockEvent);

      expect(result).toBe(mockTarget);
    });

    it("returns null when event target is null", ({ expect }) => {
      const mockEvent = new MouseEvent("click");

      Object.defineProperty(mockEvent, "target", { value: null });

      const result = ClickOutsideHelper.getEventTarget(mockEvent);

      expect(result).toBeNull();
    });
  });

  describe("shouldIgnoreTarget", (it) => {
    it("returns true when target is not in document body", ({ expect }) => {
      const detachedElement = document.createElement("div");

      const result = ClickOutsideHelper.shouldIgnoreTarget(detachedElement);

      expect(result).toBe(true);
    });

    it("returns false when target is HTML element", ({ expect }) => {
      const htmlElement = document.documentElement;

      const result = ClickOutsideHelper.shouldIgnoreTarget(htmlElement);

      expect(result).toBe(false);
    });

    it("returns false when target is in document body", ({ expect }) => {
      const bodyElement = document.body;

      const result = ClickOutsideHelper.shouldIgnoreTarget(bodyElement);

      expect(result).toBe(false);
    });

    it("returns false when target is attached to document body", ({
      expect,
    }) => {
      const attachedElement = document.createElement("div");

      document.body.appendChild(attachedElement);

      const result = ClickOutsideHelper.shouldIgnoreTarget(attachedElement);

      expect(result).toBe(false);
    });
  });
});
