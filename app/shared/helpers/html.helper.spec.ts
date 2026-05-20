import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { HtmlHelper } from "./html.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("html.helper");

const { escapeHtml } = HtmlHelper;

const TEST_DATA = {
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
