import { describe } from "vitest";

import { StringUtilsHelper } from "./string-utils.helper";
import { vitestHelpers } from "@configs/vitest/setup";

const { mockGetMapValueProbe } = vitestHelpers();

const { escapeHtml, isString, safeCamelCase, toUpperCase } = StringUtilsHelper;

const TEST_DATA = {
  BASIC: "hello world",
  ESCAPE_HTML_CASES: [
    {
      name: "should escape angle brackets",
      input: "<script>alert(0)</script>",
      expected: "&lt;script&gt;alert(0)&lt;/script&gt;",
    },
    {
      name: "should escape ampersands",
      input: "Tom & Jerry",
      expected: "Tom &amp; Jerry",
    },
    {
      name: "should escape double quotes",
      input: 'He said "hello"',
      expected: "He said &quot;hello&quot;",
    },
    {
      name: "should escape single quotes",
      input: "it's working",
      expected: "it&#39;s working",
    },
    {
      name: "should escape all special characters in a single string",
      input: `<a href="link?a=1&b=2">it's a link</a>`,
      expected:
        "&lt;a href=&quot;link?a=1&amp;b=2&quot;&gt;it&#39;s a link&lt;/a&gt;",
    },
    {
      name: "should double-escape already escaped HTML",
      input: "&lt;div&gt;",
      expected: "&amp;lt;div&amp;gt;",
    },
    {
      name: "should return the same string when no special characters exist",
      input: "plain text 123",
      expected: "plain text 123",
    },
    {
      name: "should return an empty string for empty input",
      input: "",
      expected: "",
    },
  ],
  CAMEL_CASES: [
    {
      name: "should convert a string to camelCase",
      input: "hello world",
      expected: "helloWorld",
    },
    {
      name: "should convert snake case to camelCase",
      input: "user_id",
      expected: "userId",
    },
  ],
  EXPECTED_UPPER_FROM_BASIC: "HELLO WORLD",
  MAP_LOOKUP_MISS_INPUT: `&<>"'`,
} as const;

describe("StringUtilsHelper", () => {
  describe("escapeHtml", (it) => {
    TEST_DATA.ESCAPE_HTML_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        mockGetMapValueProbe.forceMapLookupMiss = false;

        const result = escapeHtml(input);

        expect(result).toBe(expected);
      });
    });

    it("should return the matched char unchanged when the escape map lookup misses", ({
      expect,
      onTestFinished,
    }) => {
      mockGetMapValueProbe.forceMapLookupMiss = true;

      onTestFinished(() => {
        mockGetMapValueProbe.forceMapLookupMiss = false;
      });

      const result = escapeHtml(TEST_DATA.MAP_LOOKUP_MISS_INPUT);

      expect(result).toBe(TEST_DATA.MAP_LOOKUP_MISS_INPUT);
    });
  });

  describe("isString", (it) => {
    it("should return true if the value is a string", ({ expect }) => {
      const result = isString(TEST_DATA.BASIC);

      expect(result).toBe(true);
    });
  });

  describe("safeCamelCase", (it) => {
    TEST_DATA.CAMEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = safeCamelCase(input);

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
