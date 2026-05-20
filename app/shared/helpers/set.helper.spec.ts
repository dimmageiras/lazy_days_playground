import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { SetHelper } from "./set.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("set.helper");

const { hasSetValue } = SetHelper;

const TEST_DATA = {
  MEMBERSHIP_CASES: [
    {
      name: "should return true for a value present in the set",
      value: "a",
      expected: true,
    },
    {
      name: "should return false for a value absent from the set",
      value: "d",
      expected: false,
    },
  ],
  NEW_VALUE: "w",
  get SET() {
    return new Set(["a", "b", "c"]);
  },
} as const;

describe("SetHelper", () => {
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
