import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { NumberHelper } from "./number.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER,
    COMMON_STRING,
    EMPTY_ARRAY,
    EMPTY_IMMUTABLE_MAP,
    EMPTY_IMMUTABLE_SET,
    EMPTY_OBJECT,
    NAN_VALUE,
    NULL_VALUE,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("number.helper");

const { isFiniteNumber, isInteger } = NumberHelper;

const TEST_DATA = {
  DECIMAL: 3.14,
  NON_NUMBER_CASES: [
    {
      name: "should return false for NaN",
      value: NAN_VALUE,
    },
    {
      name: "should return false for Infinity",
      value: Number.POSITIVE_INFINITY,
    },
    {
      name: "should return false for a string",
      value: COMMON_STRING,
    },
    {
      name: "should return false for a boolean",
      value: BOOLEAN_TRUE,
    },
    {
      name: "should return false for a Map",
      value: EMPTY_IMMUTABLE_MAP,
    },
    {
      name: "should return false for a plain object",
      value: EMPTY_OBJECT,
    },
    {
      name: "should return false for a Set",
      value: EMPTY_IMMUTABLE_SET,
    },
    {
      name: "should return false for an array",
      value: EMPTY_ARRAY,
    },
    {
      name: "should return false for null",
      value: NULL_VALUE,
    },
    {
      name: "should return false for undefined",
      value: UNDEFINED_VALUE,
    },
  ],
  TYPE_TEST: {
    UNKNOWN_NUMBER: toUnknown(COMMON_NUMBER),
  },
} as const;

describe("NumberHelper", () => {
  describe("isFiniteNumber", (it) => {
    it("should return true for a finite number", ({ expect }) => {
      const result = isFiniteNumber(COMMON_NUMBER);

      expect(result).toBe(BOOLEAN_TRUE);
    });

    it("should return true for a decimal number", ({ expect }) => {
      const result = isFiniteNumber(TEST_DATA.DECIMAL);

      expect(result).toBe(BOOLEAN_TRUE);
    });

    TEST_DATA.NON_NUMBER_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isFiniteNumber(value)).toBe(BOOLEAN_FALSE);
      });
    });

    it("should narrow the value to number when true", ({ expect }) => {
      const { UNKNOWN_NUMBER } = TEST_DATA.TYPE_TEST;

      expect(isFiniteNumber(UNKNOWN_NUMBER)).toBe(BOOLEAN_TRUE);

      if (isFiniteNumber(UNKNOWN_NUMBER)) {
        expectTypeOf(UNKNOWN_NUMBER).toEqualTypeOf<number>();
      }
    });
  });

  describe("isInteger", (it) => {
    it("should return true for an integer", ({ expect }) => {
      const result = isInteger(COMMON_NUMBER);

      expect(result).toBe(BOOLEAN_TRUE);
    });

    it("should return false for a decimal number", ({ expect }) => {
      const result = isInteger(TEST_DATA.DECIMAL);

      expect(result).toBe(BOOLEAN_FALSE);
    });

    TEST_DATA.NON_NUMBER_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isInteger(value)).toBe(BOOLEAN_FALSE);
      });
    });

    it("should narrow the value to number when true", ({ expect }) => {
      const { UNKNOWN_NUMBER } = TEST_DATA.TYPE_TEST;

      expect(isInteger(UNKNOWN_NUMBER)).toBe(BOOLEAN_TRUE);

      if (isInteger(UNKNOWN_NUMBER)) {
        expectTypeOf(UNKNOWN_NUMBER).toEqualTypeOf<number>();
      }
    });
  });
});
