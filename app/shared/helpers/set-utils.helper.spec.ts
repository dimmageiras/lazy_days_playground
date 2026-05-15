import { describe } from "vitest";

import { SetUtilsHelper } from "./set-utils.helper";

const { hasSetValue } = SetUtilsHelper;

const TEST_DATA = {
  MEMBERSHIP_CASES: [
    {
      name: "should return true if the value is in the set",
      value: "a",
      expected: true,
    },
    {
      name: "should return false if the value is not in the set",
      value: "d",
      expected: false,
    },
  ],
  NEW_VALUE: "w",
  get SET() {
    return new Set(["a", "b", "c"]);
  },
} as const;

describe("SetUtilsHelper", () => {
  describe("hasSetValue", (it) => {
    TEST_DATA.MEMBERSHIP_CASES.forEach(({ name, value, expected }) => {
      it(name, ({ expect }) => {
        const result = hasSetValue(TEST_DATA.SET, value);

        expect(result).toBe(expected);
      });
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
