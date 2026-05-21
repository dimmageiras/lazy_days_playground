import { VitestSetup } from "@configs/vitest/setup";
import { Map, Set } from "immutable";
import { describe } from "vitest";

import { StringHelper } from "./string.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("string.helper");

const { isString, toCamelCase, toUpperCase } = StringHelper;

const TEST_DATA = {
  BASIC: "hello world",
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
  ],
  EXPECTED_UPPER_FROM_BASIC: "HELLO WORLD",
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
  });

  describe("toCamelCase", (it) => {
    TEST_DATA.CAMEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = toCamelCase(input);

        expect(result).toBe(expected);
      });
    });
  });

  describe("toUpperCase", (it) => {
    it("should convert a string to uppercase", ({ expect }) => {
      const result = toUpperCase(TEST_DATA.BASIC);

      expect(result).toBe(TEST_DATA.EXPECTED_UPPER_FROM_BASIC);
    });
  });
});
