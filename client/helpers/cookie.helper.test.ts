import { createCookie } from "react-router";
import { beforeEach, describe, vi } from "vitest";

import { CookieHelper } from "./cookie.helper";

// Mock react-router
vi.mock("react-router", () => ({
  createCookie: vi.fn(),
}));

// Mock DateHelper
vi.mock("@shared/helpers/date.helper", () => ({
  DateHelper: {
    getCurrentUTCDate: vi.fn(),
  },
}));

describe("CookieHelper", () => {
  const mockCookie = {
    isSigned: true,
    name: "test-cookie",
    parse: vi.fn(),
    serialize: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCookie).mockReturnValue(mockCookie);
  });

  describe("createStandardCookie", (it) => {
    it("should create a cookie with the provided name and base config", ({
      expect,
    }) => {
      const cookieName = "test-cookie";
      const expectedConfig = {
        httpOnly: true,
        path: "/",
        sameSite: "strict",
        secure: true, // IS_DEVELOPMENT is false in test environment
        signed: true,
      };

      const result = CookieHelper.createStandardCookie(cookieName);

      expect(createCookie).toHaveBeenCalledWith(cookieName, expectedConfig);
      expect(result).toBe(mockCookie);
    });

    it("should create cookies with different names", ({ expect }) => {
      const names = ["session-token", "user-preferences", "auth-state"];

      names.forEach((name) => {
        CookieHelper.createStandardCookie(name);
        expect(createCookie).toHaveBeenCalledWith(name, expect.any(Object));
      });

      expect(createCookie).toHaveBeenCalledTimes(names.length);
    });
  });

  describe("parseCookie", (it) => {
    it("should return null when cookieHeader is null", async ({ expect }) => {
      const result = await CookieHelper.parseCookie(mockCookie, null);

      expect(result).toBeNull();
      expect(mockCookie.parse).not.toHaveBeenCalled();
    });

    it("should return null when cookieHeader is empty string", async ({
      expect,
    }) => {
      const result = await CookieHelper.parseCookie(mockCookie, "");

      expect(result).toBeNull();
      expect(mockCookie.parse).not.toHaveBeenCalled();
    });

    it("should parse and return cookie value successfully", async ({
      expect,
    }) => {
      const cookieHeader = "test-cookie=value123";
      const expectedValue = "value123";

      mockCookie.parse.mockResolvedValue(expectedValue);

      const result = await CookieHelper.parseCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBe(expectedValue);
    });

    it("should return null when cookie parsing fails", async ({ expect }) => {
      const cookieHeader = "invalid-cookie-header";

      mockCookie.parse.mockRejectedValue(new Error("Parse error"));

      const result = await CookieHelper.parseCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBeNull();
    });

    it("should return null when parsed value is null/undefined", async ({
      expect,
    }) => {
      const cookieHeader = "test-cookie=";

      mockCookie.parse.mockResolvedValue(null);

      const result = await CookieHelper.parseCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBeNull();
    });

    it("should handle generic return types", async ({ expect }) => {
      const cookieHeader = "test-cookie=123";
      const expectedValue = 123;

      mockCookie.parse.mockResolvedValue(expectedValue);

      const result = await CookieHelper.parseCookie<number>(
        mockCookie,
        cookieHeader
      );

      expect(result).toBe(expectedValue);
      expect(typeof result).toBe("number");
    });
  });

  describe("hasCookie", (it) => {
    it("should return false when cookieHeader is null", async ({ expect }) => {
      const result = await CookieHelper.hasCookie(mockCookie, null);

      expect(result).toBe(false);
    });

    it("should return false when cookie does not exist", async ({ expect }) => {
      const cookieHeader = "other-cookie=value";

      mockCookie.parse.mockResolvedValue(null);

      const result = await CookieHelper.hasCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBe(false);
    });

    it("should return true when cookie exists with value", async ({
      expect,
    }) => {
      const cookieHeader = "test-cookie=value123";

      mockCookie.parse.mockResolvedValue("value123");

      const result = await CookieHelper.hasCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBe(true);
    });

    it("should return true when cookie exists with empty string value", async ({
      expect,
    }) => {
      const cookieHeader = "test-cookie=";

      mockCookie.parse.mockResolvedValue("");

      const result = await CookieHelper.hasCookie(mockCookie, cookieHeader);

      expect(mockCookie.parse).toHaveBeenCalledWith(cookieHeader);
      expect(result).toBe(true);
    });
  });

  describe("setCookie", (it) => {
    let mockResponse: Response;
    let mockHeaders: Headers;

    beforeEach(async () => {
      mockHeaders = {
        [Symbol.iterator]: vi.fn(),
        append: vi.fn(),
        delete: vi.fn(),
        entries: vi.fn(),
        forEach: vi.fn(),
        get: vi.fn(),
        getSetCookie: vi.fn(),
        has: vi.fn(),
        keys: vi.fn(),
        set: vi.fn(),
        values: vi.fn(),
      };

      mockResponse = {
        arrayBuffer: vi.fn(),
        blob: vi.fn(),
        body: null,
        bodyUsed: false,
        bytes: vi.fn(),
        clone: vi.fn(),
        formData: vi.fn(),
        headers: mockHeaders,
        json: vi.fn(),
        ok: true,
        redirected: false,
        status: 200,
        statusText: "OK",
        text: vi.fn(),
        type: "cors",
        url: "https://example.com",
      };

      // Mock DateHelper to provide a stable base date for testing
      const { DateHelper } = await import("@shared/helpers/date.helper");

      vi.mocked(DateHelper.getCurrentUTCDate).mockReturnValue(
        new Date("2024-01-01T00:00:00Z")
      );
    });

    it("should serialize cookie value and append Set-Cookie header to response", async ({
      expect,
    }) => {
      const value = "test-value";
      const maxAge = 300;
      const expectedSerializedCookie =
        "test-cookie=serialized-value; Max-Age=300";

      mockCookie.serialize.mockResolvedValue(expectedSerializedCookie);

      await CookieHelper.setCookie(mockResponse, mockCookie, value, maxAge);

      expect(mockCookie.serialize).toHaveBeenCalledWith(
        value,
        expect.objectContaining({
          maxAge,
        })
      );
      expect(mockCookie.serialize).toHaveBeenCalledWith(
        value,
        expect.objectContaining({
          expires: expect.any(Date),
        })
      );
      expect(mockHeaders.append).toHaveBeenCalledWith(
        "Set-Cookie",
        expectedSerializedCookie
      );
    });

    it("should handle different value types", async ({ expect }) => {
      const testCases = [
        { value: "string-value", maxAge: 600 },
        { value: 42, maxAge: 3600 },
        { value: { key: "object" }, maxAge: 86400 },
        { value: true, maxAge: 60 },
        { value: null, maxAge: 120 },
      ];

      for (const { value, maxAge } of testCases) {
        const expectedSerializedCookie = `serialized-cookie-for-${typeof value}`;

        mockCookie.serialize.mockResolvedValue(expectedSerializedCookie);

        await CookieHelper.setCookie(mockResponse, mockCookie, value, maxAge);

        expect(mockCookie.serialize).toHaveBeenCalledWith(
          value,
          expect.objectContaining({
            maxAge,
            expires: expect.any(Date),
          })
        );
        expect(mockHeaders.append).toHaveBeenCalledWith(
          "Set-Cookie",
          expectedSerializedCookie
        );
      }

      expect(mockCookie.serialize).toHaveBeenCalledTimes(testCases.length);
      expect(mockHeaders.append).toHaveBeenCalledTimes(testCases.length);
    });

    it("should pass value and maxAge to cookie serialization", async ({
      expect,
    }) => {
      const value = "session-token";
      const maxAge = 1800;

      mockCookie.serialize.mockResolvedValue("serialized-cookie");

      await CookieHelper.setCookie(mockResponse, mockCookie, value, maxAge);

      expect(mockCookie.serialize).toHaveBeenCalledWith(value, {
        maxAge,
        expires: expect.any(Date),
      });
      expect(mockHeaders.append).toHaveBeenCalledWith(
        "Set-Cookie",
        "serialized-cookie"
      );
    });
  });
});
