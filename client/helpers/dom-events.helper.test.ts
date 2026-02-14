import type { MouseEvent } from "react";
import { describe, vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { DomEventsHelper } from "./dom-events.helper";

const { handleMouseDown } = DomEventsHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  LEFT_BUTTON: 0,
  MIDDLE_BUTTON: 1,
  RIGHT_BUTTON: 2,
} as const;

// Factory function to create a mock mouse event
const createMockEvent = (button: number) => {
  const currentTarget = { click: vi.fn() };

  return castAsType<MouseEvent<HTMLButtonElement>>({
    button,
    currentTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  });
};

describe("DomEventsHelper", () => {
  describe("handleMouseDown", (it) => {
    it("should trigger click for left button by default", ({ expect }) => {
      const event = createMockEvent(TEST_DATA.LEFT_BUTTON);

      handleMouseDown(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
      expect(event.currentTarget.click).toHaveBeenCalledTimes(1);
    });

    it("should trigger click for middle button when enabled", ({ expect }) => {
      const event = createMockEvent(TEST_DATA.MIDDLE_BUTTON);

      handleMouseDown(event, { enableMiddleClick: true });

      expect(event.currentTarget.click).toHaveBeenCalledTimes(1);
    });

    it("should trigger click for right button when enabled", ({ expect }) => {
      const event = createMockEvent(TEST_DATA.RIGHT_BUTTON);

      handleMouseDown(event, { enableRightClick: true });

      expect(event.currentTarget.click).toHaveBeenCalledTimes(1);
    });

    it("should not trigger click when button is disabled", ({ expect }) => {
      const event = createMockEvent(TEST_DATA.RIGHT_BUTTON);

      handleMouseDown(event, { enableRightClick: false });

      expect(event.currentTarget.click).not.toHaveBeenCalled();
    });
  });
});
