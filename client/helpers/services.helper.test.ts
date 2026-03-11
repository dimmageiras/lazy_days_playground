import { describe } from "vitest";

import { ServicesHelper } from "./services.helper";

const { findSetCookieHeader, setSetCookieHeader } = ServicesHelper;

const TEST_DATA = {
  COOKIE_NAME: "cookie1",
  HEADERS: {
    "set-cookie": ["cookie1=value1", "cookie2=value2"],
  },
};

describe("ServicesHelper", () => {
  describe("findSetCookieHeader", (it) => {
    it("should return the matching cookie header", ({ expect }) => {
      const result = findSetCookieHeader(
        TEST_DATA.HEADERS,
        TEST_DATA.COOKIE_NAME,
      );

      expect(result).toBe("cookie1=value1");
    });
  });

  describe("setSetCookieHeader", (it) => {
    it("should set the cookie header", ({ expect }) => {
      const response = new Response();

      setSetCookieHeader(response, TEST_DATA.COOKIE_NAME);

      expect(response.headers.get("Set-Cookie")).toBe(TEST_DATA.COOKIE_NAME);
    });
  });
});
