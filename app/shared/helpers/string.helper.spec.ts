import { Map, Set } from "immutable";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { StringHelper } from "./string.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("string.helper");

const { castAsType } = TypesHelper;

const { isString, toCamelCase, toUpperCase } = StringHelper;

const TEST_DATA = {
  CAMEL_CASES: [
    {
      expected: "helloWorld",
      input: "hello world",
      name: "should convert a string to camelCase",
    },
    {
      expected: "userId",
      input: "user_id",
      name: "should convert snake case to camelCase",
    },
    {
      expected: "userId",
      input: "user-id",
      name: "should convert kebab case to camelCase",
    },
    {
      expected: "",
      input: "",
      name: "should return an empty string for an empty input",
    },
    {
      expected: "alreadyCamel",
      input: "alreadyCamel",
      name: "should return a camelCase input unchanged",
    },
  ],
  NON_STRING_CASES: [
    { name: "should return false for a boolean", value: true },
    { name: "should return false for a Map", value: Map() },
    { name: "should return false for a number", value: 42 },
    { name: "should return false for a plain object", value: {} },
    { name: "should return false for a Set", value: Set() },
    { name: "should return false for an array", value: [] },
    { name: "should return false for null", value: null },
    { name: "should return false for undefined", value: undefined },
  ],
  STRING_CASES: [
    { name: "should return true for a populated string", value: "hello world" },
    { name: "should return true for an empty string", value: "" },
  ],
  TYPE_TEST: {
    CAMELCASE_EXPECTED: "helloWorld",
    CAMELCASE_INPUT: "hello world",
    UNKNOWN_VALUE: castAsType<unknown>("hello"),
    UPPERCASE_EXPECTED: "AB",
    UPPERCASE_INPUT: "ab",
  },
  UPPER_CASES: [
    {
      expected: "HELLO WORLD",
      input: "hello world",
      name: "should uppercase basic lowercase ASCII",
    },
    {
      expected: "",
      input: "",
      name: "should return an empty string for empty input",
    },
    {
      expected: "ALREADY UPPER",
      input: "ALREADY UPPER",
      name: "should leave already-uppercase ASCII unchanged",
    },
    {
      expected: "MIXED CASE",
      input: "mIxEd CaSe",
      name: "should uppercase mixed-case ASCII",
    },
    {
      expected: "SS",
      input: "ß",
      name: "should expand the German sharp s to SS (Unicode case mapping)",
    },
    {
      expected: "Σ",
      input: "σ",
      name: "should uppercase Greek sigma",
    },
    {
      expected: "I",
      input: "i",
      name: "should uppercase Latin i to ASCII I (locale-insensitive)",
    },
  ],
} as const;

describe("StringHelper", () => {
  describe("isString", (it) => {
    TEST_DATA.STRING_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isString(value)).toBe(true);
      });
    });

    TEST_DATA.NON_STRING_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isString(value)).toBe(false);
      });
    });

    it("should narrow the value to string when true", ({ expect }) => {
      const { UNKNOWN_VALUE } = TEST_DATA.TYPE_TEST;

      expect(isString(UNKNOWN_VALUE)).toBe(true);

      if (isString(UNKNOWN_VALUE)) {
        expectTypeOf(UNKNOWN_VALUE).toEqualTypeOf<string>();
      }
    });
  });

  describe("toCamelCase", (it) => {
    TEST_DATA.CAMEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = toCamelCase(input);

        expect(result).toBe(expected);
      });
    });

    it("should narrow the return type to CamelCase<TString>", () => {
      expectTypeOf(
        toCamelCase(TEST_DATA.TYPE_TEST.CAMELCASE_INPUT),
      ).toEqualTypeOf<typeof TEST_DATA.TYPE_TEST.CAMELCASE_EXPECTED>();
    });
  });

  describe("toUpperCase", (it) => {
    TEST_DATA.UPPER_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = toUpperCase(input);

        expect(result).toBe(expected);
      });
    });

    it("should narrow the return type to Uppercase<TString>", () => {
      expectTypeOf(
        toUpperCase(TEST_DATA.TYPE_TEST.UPPERCASE_INPUT),
      ).toEqualTypeOf<typeof TEST_DATA.TYPE_TEST.UPPERCASE_EXPECTED>();
    });
  });
});
