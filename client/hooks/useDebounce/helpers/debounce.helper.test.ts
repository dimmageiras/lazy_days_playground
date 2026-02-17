import { describe, vi } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { DebounceHelper } from "./debounce.helper";

const { safeApplyCallback } = DebounceHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = [vi.fn(), undefined, "not-a-function", null] as const;

describe("DebounceHelper", () => {
  describe("safeApplyCallback", (it) => {
    it("should safely handle callbacks based on type", ({ expect }) => {
      const args = [1, 2, 3];

      TEST_DATA.forEach((callback) => {
        const typedCallback = castAsType<
          ((...args: unknown[]) => void) | undefined
        >(callback);
        let result: void | undefined;

        expect(() => {
          result = safeApplyCallback(typedCallback, args);
        }).not.toThrow();

        expect(result).toBeUndefined();

        if (typeof callback === "function") {
          expect(callback).toHaveBeenCalledWith(...args);
        }
      });
    });
  });
});
