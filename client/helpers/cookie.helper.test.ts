import type { Procedure } from "@vitest/spy";
import type { Cookie } from "react-router";
import { isCookie } from "react-router";
import type { Mock } from "vitest";
import { describe, vi } from "vitest";

import { TIMING } from "@shared/constants/timing.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { CookieHelper } from "./cookie.helper";

const { MINUTES_FIVE_IN_S } = TIMING;

const { createStandardCookie, hasCookie, parseCookie, setCookie } =
  CookieHelper;
const { castAsType } = TypeHelper;

const { mockGetFutureUTCDate } = vi.hoisted(() => ({
  mockGetFutureUTCDate: vi.fn(),
}));

vi.mock("@shared/helpers/date.helper", () => ({
  DateHelper: {
    getFutureUTCDate: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
      mockGetFutureUTCDate(...args),
  },
}));

// Test data constants
const TEST_DATA = {
  MAX_AGE: MINUTES_FIVE_IN_S,
  VALUE: "test",
} as const;

const FIXED_EXPIRES = new Date("2025-01-03T15:05:00.000Z");

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
      mockGetFutureUTCDate.mockReturnValue(FIXED_EXPIRES);

      const testCookie = createTestCookie();
      const response = new Response();

      await setCookie(response, testCookie, TEST_DATA.VALUE, TEST_DATA.MAX_AGE);

      const expectedCookie = await testCookie.serialize(TEST_DATA.VALUE, {
        maxAge: TEST_DATA.MAX_AGE,
        expires: FIXED_EXPIRES,
      });

      expect(mockGetFutureUTCDate).toHaveBeenCalledWith(TEST_DATA.MAX_AGE);
      expect(response.headers.get("Set-Cookie")).toBe(expectedCookie);
    });
  });
});
