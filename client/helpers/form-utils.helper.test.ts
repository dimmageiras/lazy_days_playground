import type { FieldErrors } from "react-hook-form";
import { describe } from "vitest";

import { TypeHelper } from "@shared/helpers/type.helper";
import type { ZodObject } from "@shared/wrappers/zod.wrapper";
import {
  zDiscriminatedUnion,
  zLiteral,
  zObject,
  zString,
} from "@shared/wrappers/zod.wrapper";

import { FormUtilsHelper } from "./form-utils.helper";

const {
  checkFieldIsRequired,
  checkFieldIsRequiredInDiscriminatedUnion,
  getNoAutofillProps,
  getSchemaFromDiscriminatedUnion,
  hasFormErrors,
} = FormUtilsHelper;
const { castAsType } = TypeHelper;

const TEST_DATA = {
  SIGNIN: "signin",
  SIGNUP: "signup",
} as const;

const AUTH_SCHEMA = zDiscriminatedUnion("mode", [
  zObject({
    mode: zLiteral(TEST_DATA.SIGNIN),
    email: zString(),
    name: zString().optional(),
  }),
  zObject({
    mode: zLiteral(TEST_DATA.SIGNUP),
    email: zString(),
    password: zString(),
    name: zString().optional(),
  }),
]);

describe("FormUtilsHelper", () => {
  describe("checkFieldIsRequired", (it) => {
    it("should return true for required fields", ({ expect }) => {
      const schema = zObject({
        email: zString(),
      });

      expect(checkFieldIsRequired(schema, "email")).toBe(true);
    });

    it("should return false for optional fields", ({ expect }) => {
      const schema = zObject({
        name: zString().optional(),
      });

      expect(checkFieldIsRequired(schema, "name")).toBe(false);
    });

    it("should return false for invalid schema shapes", ({ expect }) => {
      const invalidSchema = castAsType<ZodObject>({
        shape: {
          email: "not a zod schema",
        },
      });

      expect(checkFieldIsRequired(invalidSchema, "email")).toBe(false);
    });
  });

  describe("checkFieldIsRequiredInDiscriminatedUnion", (it) => {
    it("should return true when field is required for discriminator", ({
      expect,
    }) => {
      const result = checkFieldIsRequiredInDiscriminatedUnion(
        AUTH_SCHEMA,
        "email",
        TEST_DATA.SIGNIN,
      );

      expect(result).toBe(true);
    });

    it("should return false when field is optional for discriminator", ({
      expect,
    }) => {
      const result = checkFieldIsRequiredInDiscriminatedUnion(
        AUTH_SCHEMA,
        "name",
        TEST_DATA.SIGNIN,
      );

      expect(result).toBe(false);
    });

    it("should return false when discriminator is unknown", ({ expect }) => {
      const result = checkFieldIsRequiredInDiscriminatedUnion(
        AUTH_SCHEMA,
        "email",
        castAsType<"signin" | "signup">("reset"),
      );

      expect(result).toBe(false);
    });
  });

  describe("getNoAutofillProps", (it) => {
    it("should return no-autofill attributes", ({ expect }) => {
      const result = getNoAutofillProps();

      expect(result).toMatchObject({
        "aria-autocomplete": "none",
        autoComplete: "off",
        "data-1p-ignore": true,
        "data-op-ignore": true,
        "data-bwignore": true,
        "data-form-type": "other",
        "data-lpignore": "true",
      });
    });
  });

  describe("getSchemaFromDiscriminatedUnion", (it) => {
    it("should return the matching schema", ({ expect }) => {
      const result = getSchemaFromDiscriminatedUnion(
        AUTH_SCHEMA,
        TEST_DATA.SIGNIN,
      );

      const typedResult = castAsType<{ shape: { mode: { value: string } } }>(
        result,
      );

      expect(result).toBeDefined();
      expect(typedResult?.shape.mode.value).toBe(TEST_DATA.SIGNIN);
    });

    it("should return undefined when no schema matches", ({ expect }) => {
      const result = getSchemaFromDiscriminatedUnion(
        AUTH_SCHEMA,
        castAsType<"signin" | "signup">("reset"),
      );

      expect(result).toBeUndefined();
    });
  });

  describe("hasFormErrors", (it) => {
    it("should return false when there are no errors", ({ expect }) => {
      const errors = castAsType<FieldErrors>({});

      expect(hasFormErrors(errors)).toBe(false);
    });

    it("should return true when there are errors", ({ expect }) => {
      const errors = castAsType<FieldErrors>({
        email: { message: "Required" },
      });

      expect(hasFormErrors(errors)).toBe(true);
    });
  });
});
