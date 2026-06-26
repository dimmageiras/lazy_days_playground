import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypeHelper } from "./type.helper";

const {
  sharedTestData: {
    BOOLEAN_TRUE,
    COMMON_NUMBER,
    COMMON_STRING,
    EMPTY_ARRAY,
    EMPTY_OBJECT,
    NULL_VALUE,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("type.helper");

const { castAsType } = TypeHelper;

const TEST_DATA = {
  IDENTITY_CASES: [
    { name: "should return a string unchanged", value: COMMON_STRING },
    { name: "should return a number unchanged", value: COMMON_NUMBER },
    { name: "should return a boolean unchanged", value: BOOLEAN_TRUE },
    { name: "should return the same object reference", value: EMPTY_OBJECT },
    { name: "should return the same array reference", value: EMPTY_ARRAY },
    { name: "should return null unchanged", value: NULL_VALUE },
    { name: "should return undefined unchanged", value: UNDEFINED_VALUE },
  ],
  TYPE_TEST: {
    UNKNOWN_NUMBER: toUnknown(COMMON_NUMBER),
    UNKNOWN_STRING: toUnknown(COMMON_STRING),
  },
} as const;

describe("TypeHelper", () => {
  describe("castAsType", (it) => {
    TEST_DATA.IDENTITY_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(castAsType(value)).toBe(value);
      });
    });

    it("should retype an unknown value to the target type", ({ expect }) => {
      const { UNKNOWN_NUMBER } = TEST_DATA.TYPE_TEST;

      expect(castAsType<number>(UNKNOWN_NUMBER)).toBe(COMMON_NUMBER);

      expectTypeOf(castAsType<number>(UNKNOWN_NUMBER)).toEqualTypeOf<number>();
    });

    it("should retype to a string-literal target type", ({ expect }) => {
      const { UNKNOWN_STRING } = TEST_DATA.TYPE_TEST;

      expect(castAsType<typeof COMMON_STRING>(UNKNOWN_STRING)).toBe(
        COMMON_STRING,
      );

      expectTypeOf(
        castAsType<typeof COMMON_STRING>(UNKNOWN_STRING),
      ).toEqualTypeOf<typeof COMMON_STRING>();
    });
  });
});
