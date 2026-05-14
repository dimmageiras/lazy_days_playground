import { describe } from "vitest";

import { SetUtilsHelper } from "./set-utils.helper";

const { hasSetValue } = SetUtilsHelper;

const TEST_DATA = {
  ABSENT_VALUE: "d",
  NEW_VALUE: "w",
  PRESENT_VALUE: "a",
  get SET() {
    return new Set(["a", "b", "c"]);
  },
} as const;

describe("SetUtilsHelper", () => {
  describe("hasSetValue", (it) => {
    it("should return true if the value is in the set", ({ expect }) => {
      const result = hasSetValue(TEST_DATA.SET, TEST_DATA.PRESENT_VALUE);

      expect(result).toBe(true);
    });

    it("should return false if the value is not in the set", ({ expect }) => {
      const result = hasSetValue(TEST_DATA.SET, TEST_DATA.ABSENT_VALUE);

      expect(result).toBe(false);
    });

    it("should return true for a value added to the set after creation", ({
      expect,
    }) => {
      const set = TEST_DATA.SET;

      set.add(TEST_DATA.NEW_VALUE);

      const result = hasSetValue(set, TEST_DATA.NEW_VALUE);

      expect(result).toBe(true);
    });
  });
});
