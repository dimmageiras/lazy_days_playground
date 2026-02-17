import { describe } from "vitest";

import { ClickOutsideHelper } from "./click-outside.helper";

const { getEventTarget, shouldIgnoreTarget } = ClickOutsideHelper;

describe("ClickOutsideHelper", () => {
  describe("getEventTarget", (it) => {
    it("should return the event target", ({ expect }) => {
      const event = new Event("click");
      const target = getEventTarget(event);

      expect(target).toBe(event.target);
    });
  });

  describe("shouldIgnoreTarget", (it) => {
    it("should return true if the target is not in the document", ({
      expect,
    }) => {
      const target = document.createElement("div");
      const result = shouldIgnoreTarget(target);

      expect(result).toBe(true);
    });
  });
});
