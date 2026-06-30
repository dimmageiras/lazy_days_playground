import type { CamelCase } from "type-fest";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { StringHelper } from "./string.helper";

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
    EMPTY_STRING,
    NAN_VALUE,
    NULL_VALUE,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("string.helper");

const { isString, toCamelCase, toUpperCase } = StringHelper;

const TEST_DATA = {
  CAMEL_CASES: [
    {
      expected: "helloWorld",
      input: "hello world",
      name: "should convert space-separated words to camelCase",
    },
    {
      expected: "userId",
      input: "user_id",
      name: "should convert snake_case to camelCase",
    },
    {
      expected: "userId",
      input: "user-id",
      name: "should convert kebab-case to camelCase",
    },
    {
      expected: "alreadyCamel",
      input: "alreadyCamel",
      name: "should leave an already-camelCased string unchanged",
    },
    {
      expected: COMMON_STRING,
      input: COMMON_STRING,
      name: "should leave a single lowercase word unchanged",
    },
    {
      expected: EMPTY_STRING,
      input: EMPTY_STRING,
      name: "should return an empty string for empty input",
    },
  ],
  NON_STRING_CASES: [
    { name: "should return false for a boolean", value: BOOLEAN_TRUE },
    { name: "should return false for a Map", value: EMPTY_IMMUTABLE_MAP },
    { name: "should return false for a number", value: COMMON_NUMBER },
    { name: "should return false for a plain object", value: EMPTY_OBJECT },
    { name: "should return false for a Set", value: EMPTY_IMMUTABLE_SET },
    { name: "should return false for an array", value: EMPTY_ARRAY },
    { name: "should return false for NaN", value: NAN_VALUE },
    { name: "should return false for null", value: NULL_VALUE },
    { name: "should return false for undefined", value: UNDEFINED_VALUE },
  ],
  STRING_CASES: [
    { name: "should return true for a populated string", value: COMMON_STRING },
    { name: "should return true for an empty string", value: EMPTY_STRING },
  ],
  TYPE_TEST: {
    UNKNOWN_STRING: toUnknown(COMMON_STRING),
  },
  UPPER_CASES: [
    {
      expected: "HELLO WORLD",
      input: "hello world",
      name: "should uppercase space-separated words",
    },
    {
      expected: "HELLO",
      input: COMMON_STRING,
      name: "should uppercase a lowercase word",
    },
    {
      expected: "MIXED",
      input: "MiXeD",
      name: "should uppercase a mixed-case word",
    },
    {
      expected: "STRASSE",
      input: "straße",
      name: "should expand the German sharp s when uppercasing",
    },
    {
      expected: "Σ",
      input: "σ",
      name: "should uppercase the Greek sigma",
    },
    {
      expected: "I",
      input: "i",
      name: "should uppercase the Latin i to ASCII I",
    },
    {
      expected: EMPTY_STRING,
      input: EMPTY_STRING,
      name: "should return an empty string for empty input",
    },
  ],
} as const;

describe("StringHelper", () => {
  describe("isString", (it) => {
    TEST_DATA.STRING_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isString(value)).toBe(BOOLEAN_TRUE);
      });
    });

    TEST_DATA.NON_STRING_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isString(value)).toBe(BOOLEAN_FALSE);
      });
    });

    it("should narrow the value to string when true", ({ expect }) => {
      const { UNKNOWN_STRING } = TEST_DATA.TYPE_TEST;

      expect(isString(UNKNOWN_STRING)).toBe(BOOLEAN_TRUE);

      if (isString(UNKNOWN_STRING)) {
        expectTypeOf(UNKNOWN_STRING).toEqualTypeOf<string>();
      }
    });
  });

  describe("toCamelCase", (it) => {
    TEST_DATA.CAMEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        expect(toCamelCase(input)).toBe(expected);
      });
    });

    it("should type the result as CamelCase of the input", ({ expect }) => {
      expect(toCamelCase(COMMON_STRING)).toBe(COMMON_STRING);

      expectTypeOf(toCamelCase(COMMON_STRING)).toEqualTypeOf<
        CamelCase<typeof COMMON_STRING>
      >();
    });
  });

  describe("toUpperCase", (it) => {
    TEST_DATA.UPPER_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        expect(toUpperCase(input)).toBe(expected);
      });
    });

    it("should type the result as Uppercase of the input", ({ expect }) => {
      expect(toUpperCase(COMMON_STRING)).toBe("HELLO");

      expectTypeOf(toUpperCase(COMMON_STRING)).toEqualTypeOf<
        Uppercase<typeof COMMON_STRING>
      >();
    });
  });
});
