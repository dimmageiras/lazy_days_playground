import type { CamelCase, Replace } from "type-fest";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { StringHelper } from "./string.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER,
    COMMON_STRING,
    COMMON_STRING_CAMELCASE,
    COMMON_STRING_UPPERCASE,
    EMPTY_ARRAY,
    EMPTY_IMMUTABLE_MAP,
    EMPTY_IMMUTABLE_SET,
    EMPTY_OBJECT,
    EMPTY_STRING,
    NAN_VALUE,
    NULL_VALUE,
    STRING_A,
    STRING_B,
    STRING_C,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("string.helper");

const { isString, replace, toCamelCase, toUpperCase } = StringHelper;

const TEST_DATA = {
  CAMEL_CASES: [
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
      expected: COMMON_STRING_CAMELCASE,
      input: COMMON_STRING_CAMELCASE,
      name: "should leave an already-camelCased string unchanged",
    },
    {
      expected: COMMON_STRING_CAMELCASE,
      input: COMMON_STRING,
      name: "should convert to camelCase",
    },
    {
      expected: EMPTY_STRING,
      input: EMPTY_STRING,
      name: "should return an empty string for empty input",
    },
  ],
  NON_STRING_CASES: [
    {
      name: "should return false for a boolean",
      value: BOOLEAN_TRUE,
    },
    {
      name: "should return false for a Map",
      value: EMPTY_IMMUTABLE_MAP,
    },
    {
      name: "should return false for a number",
      value: COMMON_NUMBER,
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
      name: "should return false for NaN",
      value: NAN_VALUE,
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
  REPLACE_CASES: [
    {
      expected: COMMON_STRING_UPPERCASE,
      input: COMMON_STRING,
      name: "should substitute a matched substring",
      replacement: COMMON_STRING_UPPERCASE,
      search: COMMON_STRING,
    },
    {
      expected: `${STRING_B}${STRING_C}`,
      input: `${STRING_A}${STRING_B}${STRING_C}`,
      name: "should strip a matched prefix when the replacement is empty",
      replacement: EMPTY_STRING,
      search: STRING_A,
    },
    {
      expected: `${STRING_C}${STRING_B}${STRING_A}`,
      input: `${STRING_A}${STRING_B}${STRING_A}`,
      name: "should replace only the first occurrence",
      replacement: STRING_C,
      search: STRING_A,
    },
    {
      expected: COMMON_STRING,
      input: COMMON_STRING,
      name: "should leave the string unchanged when there is no match",
      replacement: STRING_B,
      search: STRING_A,
    },
    {
      expected: EMPTY_STRING,
      input: EMPTY_STRING,
      name: "should return an empty string for empty input",
      replacement: STRING_B,
      search: STRING_A,
    },
  ],
  STRING_CASES: [
    {
      name: "should return true for a populated string",
      value: COMMON_STRING,
    },
    {
      name: "should return true for an empty string",
      value: EMPTY_STRING,
    },
  ],
  TYPE_TEST: {
    UNKNOWN_STRING: toUnknown(COMMON_STRING),
  },
  UPPER_CASES: [
    {
      expected: COMMON_STRING_UPPERCASE,
      input: COMMON_STRING,
      name: "should uppercase a lowercase word or phrase",
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

  describe("replace", (it) => {
    TEST_DATA.REPLACE_CASES.forEach(
      ({ name, input, search, replacement, expected }) => {
        it(name, ({ expect }) => {
          expect(replace(input, search, replacement)).toBe(expected);
        });
      },
    );

    it("should type the result as Replace of the input", ({ expect }) => {
      expect(
        replace(COMMON_STRING, COMMON_STRING, COMMON_STRING_UPPERCASE),
      ).toBe(COMMON_STRING_UPPERCASE);

      expectTypeOf(
        replace(COMMON_STRING, COMMON_STRING, COMMON_STRING_UPPERCASE),
      ).toEqualTypeOf<
        Replace<
          typeof COMMON_STRING,
          typeof COMMON_STRING,
          typeof COMMON_STRING_UPPERCASE
        >
      >();
    });
  });

  describe("toCamelCase", (it) => {
    TEST_DATA.CAMEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        expect(toCamelCase(input)).toBe(expected);
      });
    });

    it("should type the result as CamelCase of the input", ({ expect }) => {
      expect(toCamelCase(COMMON_STRING)).toBe(COMMON_STRING_CAMELCASE);

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
      expect(toUpperCase(COMMON_STRING)).toBe(COMMON_STRING_UPPERCASE);

      expectTypeOf(toUpperCase(COMMON_STRING)).toEqualTypeOf<
        Uppercase<typeof COMMON_STRING>
      >();
    });
  });
});
