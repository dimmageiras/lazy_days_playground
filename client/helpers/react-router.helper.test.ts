import type { FlightLikePayload } from "react-router";
import { describe } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";

import { ReactRouterHelper } from "./react-router.helper";

const { decodeFlightLikePayload } = ReactRouterHelper;
const { castAsType } = TypeHelper;

const TEST_DATA = {
  ARRAY_WITH_REFERENCES: [
    { _1: 2 },
    "mutations",
    [3],
    { _4: 5, _6: 7 },
    "mutationKey",
    ["user", "check-email"],
    "state",
    { _8: 9 },
    "status",
    "success",
  ] as const,
  CIRCULAR_REFERENCE: [
    { _1: 2 },
    "parent",
    { _3: 4, _5: 0 },
    "child",
    "value",
    "root",
  ],
  CUSTOM_SLOT: ["ignored", "ignored", { _3: 4 }, "x", "y"] as const,
  EMPTY_ARRAY: [{ _1: 2 }, "items", []] as const,
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
  NOT_AN_ARRAY: castAsType<FlightLikePayload>("not-an-array"),
  PRIMITIVE_STRING: ["hello"] as const,
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

    it("should resolve numeric references inside arrays", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.ARRAY_WITH_REFERENCES);

      expect(result).toStrictEqual({
        mutations: [
          {
            mutationKey: ["user", "check-email"],
            state: { status: "success" },
          },
        ],
      });
    });

    it("should handle circular references without infinite recursion", ({
      expect,
    }) => {
      const result = decodeFlightLikePayload(TEST_DATA.CIRCULAR_REFERENCE);

      expect(result).toStrictEqual({
        parent: { child: "value", root: undefined },
      });
    });

    it("should preserve empty arrays", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.EMPTY_ARRAY);

      expect(result).toStrictEqual({ items: [] });
    });

    it("should throw when table is not an array", ({ expect }) => {
      expect(() => decodeFlightLikePayload(TEST_DATA.NOT_AN_ARRAY)).toThrow(
        "Table is not an array",
      );
    });

    it("should return null when root slot is a primitive", ({ expect }) => {
      const result = decodeFlightLikePayload(TEST_DATA.PRIMITIVE_STRING);

      expect(result).toBeNull();
    });
  });
});
