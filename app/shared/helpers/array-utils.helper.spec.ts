import { describe } from "vitest";

import { ArrayUtilsHelper } from "./array-utils.helper";

const { isArray } = ArrayUtilsHelper;

const TEST_DATA = {
  ARRAYS: [
    { name: "should return true for an empty array", value: [] },
    { name: "should return true for a populated array", value: [1, 2, 3] },
  ],
  NON_ARRAYS: [
    { name: "should return false for null", value: null },
    { name: "should return false for undefined", value: undefined },
    { name: "should return false for a plain object", value: {} },
    { name: "should return false for a string", value: "hello" },
    { name: "should return false for a number", value: 42 },
    { name: "should return false for a boolean", value: true },
    { name: "should return false for a Map", value: new Map() },
    { name: "should return false for a Set", value: new Set() },
  ],
} as const;

describe("ArrayUtilsHelper", () => {
  describe("isArray", (it) => {
    TEST_DATA.ARRAYS.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(true);
      });
    });

    TEST_DATA.NON_ARRAYS.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(false);
      });
    });
  });
});
