import { describe } from "vitest";

import { ReactRouterHelper } from "./react-router.helper";

const { decodeFlightLikePayload } = ReactRouterHelper;

const TEST_DATA = {
  CUSTOM_SLOT: ["ignored", "ignored", { _3: 4 }, "x", "y"] as const,
  FLAT: [{ _1: 2 }, "email", "user@test.com"] as const,
  NESTED: [
    { _1: 2 },
    "data",
    { _3: 4 },
    "defaultValues",
    { _5: 6, _7: 8 },
    "email",
    "user@test.com",
    "mode",
    "signup",
  ] as const,
  PRIMITIVE_STRING: ["hello"] as const,
  PRIMITIVE_NUMBER: [42] as const,
  REDIRECT: [
    { _1: 2, _3: 4, _5: 6, _7: 8, _9: 10 },
    "redirect",
    "/",
    "status",
    302,
    "revalidate",
    true,
    "reload",
    false,
    "replace",
    false,
  ] as const,
} as const;

describe("ReactRouterHelper", () => {
  describe("decodeFlightLikePayload", (it) => {
    it("should decode a flat object", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.FLAT);

      expect(result).toStrictEqual({ email: "user@test.com" });
    });

    it("should decode a nested object", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.NESTED);

      expect(result).toStrictEqual({
        data: {
          defaultValues: {
            email: "user@test.com",
            mode: "signup",
          },
        },
      });
    });

    it("should return primitive when entry is not an object", ({ expect }) => {
      const stringResult = decodeFlightLikePayload(TEST_DATA.PRIMITIVE_STRING);
      const numberResult = decodeFlightLikePayload(TEST_DATA.PRIMITIVE_NUMBER);

      expect(stringResult).toBe("hello");
      expect(numberResult).toBe(42);
    });

    it("should decode a SingleFetchRedirect shape", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.REDIRECT);

      expect(result).toStrictEqual({
        redirect: "/",
        status: 302,
        revalidate: true,
        reload: false,
        replace: false,
      });
    });

    it("should decode from a custom slot", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.CUSTOM_SLOT, 2);

      expect(result).toStrictEqual({ x: "y" });
    });
  });
});
