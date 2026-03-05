import { describe } from "vitest";

import { SetUtilsHelper } from "./set-utils.helper";

const { hasSetValue } = SetUtilsHelper;

// Test data constants
const TEST_DATA = {
  SET: new Set(["a", "b", "c"]),
} as const;

describe("SetUtilsHelper", () => {
  describe("hasSetValue", (it) => {
    it("should return true if the value is in the set", ({ expect }) => {
      const result = hasSetValue(TEST_DATA.SET, "a");

      expect(result).toBe(true);
    });

    it("should return false if the value is not in the set", ({ expect }) => {
      const result = hasSetValue(TEST_DATA.SET, "d");

      expect(result).toBe(false);
    });
  });
});
