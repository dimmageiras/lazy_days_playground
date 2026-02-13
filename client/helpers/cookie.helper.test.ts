import type { Cookie } from "react-router";
import { isCookie } from "react-router";
import { describe } from "vitest";

import { DateHelper } from "@shared/helpers/date.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

import { CookieHelper } from "./cookie.helper";

const { createStandardCookie, hasCookie, parseCookie, setCookie } =
  CookieHelper;
const { getFutureUTCDate } = DateHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  MAX_AGE: 300, // 5 minutes in seconds
  VALUE: "test",
} as const;

describe("CookieHelper", () => {
  // Factory function to create a test cookie instance
  const createTestCookie = () => createStandardCookie(TEST_DATA.VALUE);

  describe("createStandardCookie", (it) => {
    it("should create a standard cookie instance", ({ expect }) => {
      const testCookie = createTestCookie();

      expect(isCookie(testCookie)).toBe(true);
    });
  });

  describe("hasCookie", (it) => {
    it("should check if a cookie exists", async ({ expect }) => {
      const testCookie = createTestCookie();

      const result = await hasCookie(
        testCookie,
        await testCookie.serialize(TEST_DATA.VALUE),
      );

      expect(result).toBe(true);
    });
  });

  describe("parseCookie", (it) => {
    it("should parse a cookie value", async ({ expect }) => {
      const testCookie = createTestCookie();

      const result = await parseCookie(
        testCookie,
        await testCookie.serialize(TEST_DATA.VALUE),
      );

      expect(result).toBe(TEST_DATA.VALUE);
    });

    it("should return null if the cookie does not exist", async ({
      expect,
    }) => {
      const testCookie = createTestCookie();

      const result = await parseCookie(testCookie, null);

      expect(result).toBeNull();
    });

    it("should return null if the cookie is invalid", async ({ expect }) => {
      const testCookie = createTestCookie();

      const result = await parseCookie(testCookie, "invalid");

      expect(result).toBeNull();
    });

    it("should return null if the cookie instance is invalid", async ({
      expect,
    }) => {
      const testCookie = createTestCookie();

      const result = await parseCookie(
        castAsType<Cookie>(null),
        await testCookie.serialize(TEST_DATA.VALUE),
      );

      expect(result).toBeNull();
    });
  });

  describe("setCookie", (it) => {
    it("should set a cookie", async ({ expect }) => {
      const testCookie = createTestCookie();
      const response = new Response();

      const expires = getFutureUTCDate(TEST_DATA.MAX_AGE);

      await setCookie(response, testCookie, TEST_DATA.VALUE, TEST_DATA.MAX_AGE);

      const expectedCookie = await testCookie.serialize(TEST_DATA.VALUE, {
        maxAge: TEST_DATA.MAX_AGE,
        expires,
      });

      expect(response.headers.get("Set-Cookie")).toBe(expectedCookie);
    });
  });
});
