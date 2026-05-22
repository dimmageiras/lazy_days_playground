import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { HtmlHelper } from "./html.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("html.helper");

const { escapeHtml } = HtmlHelper;

const TEST_DATA = {
  ESCAPE_HTML_CASES: [
    {
      expected: "&lt;script&gt;alert(0)&lt;/script&gt;",
      input: "<script>alert(0)</script>",
      name: "should escape angle brackets",
    },
    {
      expected: "Tom &amp; Jerry",
      input: "Tom & Jerry",
      name: "should escape ampersands",
    },
    {
      expected: "He said &quot;hello&quot;",
      input: 'He said "hello"',
      name: "should escape double quotes",
    },
    {
      expected: "it&#39;s working",
      input: "it's working",
      name: "should escape single quotes",
    },
    {
      expected:
        "&lt;a href=&quot;link?a=1&amp;b=2&quot;&gt;it&#39;s a link&lt;/a&gt;",
      input: `<a href="link?a=1&b=2">it's a link</a>`,
      name: "should escape all special characters in a single string",
    },
    {
      expected: "&amp;lt;div&amp;gt;",
      input: "&lt;div&gt;",
      name: "should double-escape already escaped HTML",
    },
    {
      expected: "plain text 123",
      input: "plain text 123",
      name: "should return the same string when no special characters exist",
    },
    {
      expected: "",
      input: "",
      name: "should return an empty string for empty input",
    },
    {
      expected: "a\0b",
      input: "a\0b",
      name: "should round-trip a null byte unchanged",
    },
    {
      expected: "😀",
      input: "😀",
      name: "should round-trip a non-BMP emoji (surrogate pair) unchanged",
    },
    {
      expected: "\x07",
      input: "\x07",
      name: "should round-trip a BEL control character unchanged",
    },
  ],
} as const;

describe("HtmlHelper", () => {
  describe("escapeHtml", (it) => {
    TEST_DATA.ESCAPE_HTML_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = escapeHtml(input);

        expect(result).toBe(expected);
      });
    });
  });
});
