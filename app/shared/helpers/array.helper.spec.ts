import type { UnknownArray } from "type-fest";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ArrayHelper } from "./array.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER_ARRAY,
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
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("array.helper");

const { isArray } = ArrayHelper;

const TEST_DATA = {
  ARRAY_CASES: [
    {
      name: "should return true for a populated array",
      value: COMMON_NUMBER_ARRAY,
    },
    { name: "should return true for an empty array", value: EMPTY_ARRAY },
  ],
  TYPE_TEST: {
    UNKNOWN_VALUE: toUnknown(COMMON_NUMBER_ARRAY),
  },
  get NON_ARRAY_CASES() {
    return [
      { name: "should return false for a boolean", value: BOOLEAN_TRUE },
      { name: "should return false for a Map", value: EMPTY_IMMUTABLE_MAP },
      { name: "should return false for a number", value: COMMON_NUMBER },
      { name: "should return false for a plain object", value: EMPTY_OBJECT },
      { name: "should return false for a Set", value: EMPTY_IMMUTABLE_SET },
      { name: "should return false for a string", value: COMMON_STRING },
      { name: "should return false for a Uint8Array", value: new Uint8Array() },
      { name: "should return false for NaN", value: NAN_VALUE },
      { name: "should return false for null", value: NULL_VALUE },
      { name: "should return false for undefined", value: UNDEFINED_VALUE },
      {
        name: "should return false for an arguments object",
        value: this.makeArguments(COMMON_NUMBER_ARRAY.entries()),
      },
    ];
  },
  get makeArguments() {
    return (..._args: Array<unknown>) => {
      return arguments;
    };
  },
} as const;

describe("ArrayHelper", () => {
  describe("isArray", (it) => {
    TEST_DATA.ARRAY_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(BOOLEAN_TRUE);
      });
    });

    TEST_DATA.NON_ARRAY_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(BOOLEAN_FALSE);
      });
    });

    it("should narrow the value to UnknownArray when true", ({ expect }) => {
      const { UNKNOWN_VALUE } = TEST_DATA.TYPE_TEST;

      expect(isArray(UNKNOWN_VALUE)).toBe(BOOLEAN_TRUE);

      if (isArray(UNKNOWN_VALUE)) {
        expectTypeOf(UNKNOWN_VALUE).toEqualTypeOf<UnknownArray>();
      }
    });
  });
});
