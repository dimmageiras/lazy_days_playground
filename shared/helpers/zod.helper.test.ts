import { beforeAll, beforeEach, describe, vi } from "vitest";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import type { IssueCodes } from "@shared/types/app/zod";
import type {
  zConfig as zConfigType,
  ZodError,
  ZodLocale,
} from "@shared/wrappers/zod.wrapper";

import { ZodUtilsHelper } from "./zod.helper";

// Mock zod wrapper to control imports
vi.mock("../wrappers/zod.wrapper", () => ({
  zConfig: vi.fn(),
}));

describe("ZodUtilsHelper", () => {
  const {
    CUSTOM,
    INVALID_TYPE,
    INVALID_UNION,
    NOT_MULTIPLE_OF,
    TOO_BIG,
    TOO_SMALL,
    UNRECOGNIZED_KEYS,
  } = ISSUE_CODES;

  const { formatError, loadLocale } = ZodUtilsHelper;

  const mockZodErrorBase: ZodError = {
    addIssue: vi.fn(),
    addIssues: vi.fn(),
    cause: "ZodErrorTest",
    flatten: vi.fn(),
    format: vi.fn(),
    isEmpty: false,
    issues: [],
    message: "ZodErrorTest",
    name: "ZodErrorTest",
    type: "ZodErrorTest",
    stack: "ZodErrorTest",
    _zod: {
      def: [],
      output: "ZodErrorTest",
    },
  };

  describe("formatError", (it) => {
    it("formats a single ZodError issue correctly", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "too_small",
            message: "Number must be greater than or equal to 1",
            minimum: 1,
            origin: "number",
            path: ["age"],
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Number must be greater than or equal to 1",
          path: "age",
          validation_code: TOO_SMALL,
        },
      ]);
    });

    it("formats multiple ZodError issues correctly", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "too_small",
            message: "Number must be greater than or equal to 1",
            minimum: 1,
            origin: "number",
            path: ["age"],
          },
          {
            code: "invalid_type",
            expected: "string",
            message: "Expected string, received number",
            path: ["name"],
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Number must be greater than or equal to 1",
          path: "age",
          validation_code: TOO_SMALL,
        },
        {
          message: "Expected string, received number",
          path: "name",
          validation_code: INVALID_TYPE,
        },
      ]);
    });

    it("formats nested path correctly", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            message: "Expected string, received number",
            path: ["user", "profile", "name"],
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Expected string, received number",
          path: "user.profile.name",
          validation_code: INVALID_TYPE,
        },
      ]);
    });

    it("handles custom error codes with params", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "custom",
            message: "Custom validation failed",
            path: ["email"],
            params: {
              code: "invalid_email_format",
            },
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Custom validation failed",
          path: "email",
          validation_code: "invalid_email_format",
        },
      ]);
    });

    it("handles custom error codes without params", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "custom",
            message: "Custom validation failed",
            path: ["field"],
            params: undefined,
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Custom validation failed",
          path: "field",
          validation_code: undefined,
        },
      ]);
    });

    it("formats ISSUE_CODES error types correctly", ({ expect }) => {
      // Test invalid_type
      const mockZodErrorInvalidType: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: INVALID_TYPE,
            expected: "string",
            message: `Test message for ${INVALID_TYPE}`,
            path: ["test"],
          },
        ],
      };

      const resultInvalidType = formatError(mockZodErrorInvalidType);

      expect(resultInvalidType[0]?.validation_code).toBe(INVALID_TYPE);

      // Test invalid_union
      const mockZodErrorInvalidUnion: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: INVALID_UNION,
            errors: [[], []],
            message: `Test message for ${INVALID_UNION}`,
            path: ["test"],
          },
        ],
      };

      const resultInvalidUnion = formatError(mockZodErrorInvalidUnion);

      expect(resultInvalidUnion[0]?.validation_code).toBe(INVALID_UNION);

      // Test unrecognized_keys
      const mockZodErrorUnrecognizedKeys: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: UNRECOGNIZED_KEYS,
            keys: ["extraKey"],
            message: `Test message for ${UNRECOGNIZED_KEYS}`,
            path: ["test"],
          },
        ],
      };

      const resultUnrecognizedKeys = formatError(mockZodErrorUnrecognizedKeys);

      expect(resultUnrecognizedKeys[0]?.validation_code).toBe(
        UNRECOGNIZED_KEYS
      );

      // Test too_small
      const mockZodErrorTooSmall: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: TOO_SMALL,
            minimum: 1,
            origin: "number",
            message: `Test message for ${TOO_SMALL}`,
            path: ["test"],
          },
        ],
      };

      const resultTooSmall = formatError(mockZodErrorTooSmall);

      expect(resultTooSmall[0]?.validation_code).toBe(TOO_SMALL);

      // Test too_big
      const mockZodErrorTooBig: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: TOO_BIG,
            maximum: 100,
            origin: "number",
            message: `Test message for ${TOO_BIG}`,
            path: ["test"],
          },
        ],
      };

      const resultTooBig = formatError(mockZodErrorTooBig);

      expect(resultTooBig[0]?.validation_code).toBe(TOO_BIG);

      // Test not_multiple_of
      const mockZodErrorNotMultipleOf: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: NOT_MULTIPLE_OF,
            divisor: 5,
            message: `Test message for ${NOT_MULTIPLE_OF}`,
            path: ["test"],
          },
        ],
      };
      const resultNotMultipleOf = formatError(mockZodErrorNotMultipleOf);

      expect(resultNotMultipleOf[0]?.validation_code).toBe(NOT_MULTIPLE_OF);

      // Test custom
      const mockZodErrorCustom: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: CUSTOM,
            message: `Test message for ${CUSTOM}`,
            path: ["test"],
          },
        ],
      };
      const resultCustom = formatError(mockZodErrorCustom);

      expect(resultCustom[0]?.validation_code).toBe(undefined);
    });

    it("formats non-ISSUE_CODES error types as-is", ({ expect }) => {
      const testCases: IssueCodes[] = [
        "invalid_arguments",
        "invalid_date",
        "invalid_enum_value",
        "invalid_intersection_types",
        "invalid_literal",
        "invalid_return_type",
        "invalid_string",
        "invalid_union_discriminator",
        "not_finite",
      ];

      testCases.forEach((code) => {
        const mockZodError: ZodError = {
          ...mockZodErrorBase,
          issues: [
            {
              code,
              message: `Test message for ${code}`,
              path: ["test"],
            },
          ],
        };

        const result = formatError(mockZodError);

        expect(result[0]?.validation_code).toBe(code);
        expect(result[0]?.message).toBe(`Test message for ${code}`);
        expect(result[0]?.path).toBe("test");
      });
    });

    it("returns empty array for ZodError with no issues", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([]);
    });

    it("handles empty path correctly", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            message: "Expected string, received number",
            path: [],
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toEqual([
        {
          message: "Expected string, received number",
          path: "",
          validation_code: INVALID_TYPE,
        },
      ]);
    });

    it("preserves issue order", ({ expect }) => {
      const mockZodError: ZodError = {
        ...mockZodErrorBase,
        issues: [
          {
            code: "invalid_type",
            expected: "string",
            message: "First error",
            path: ["first"],
          },
          {
            code: "too_small",
            message: "Second error",
            minimum: 1,
            origin: "number",
            path: ["second"],
          },
          {
            code: "custom",
            message: "Third error",
            path: ["third"],
          },
        ],
      };

      const result = formatError(mockZodError);

      expect(result).toHaveLength(3);
      expect(result[0]?.message).toBe("First error");
      expect(result[1]?.message).toBe("Second error");
      expect(result[2]?.message).toBe("Third error");
    });
  });

  describe("loadLocale", (it) => {
    let zConfig: typeof zConfigType;

    beforeAll(async () => {
      const zodWrapper = await import("../wrappers/zod.wrapper");

      zConfig = zodWrapper.zConfig;
    });

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("loads all supported locales successfully", async ({ expect }) => {
      const locales: ZodLocale[] = [
        "ar",
        "de",
        "en",
        "es",
        "fr",
        "it",
        "ja",
        "ko",
        "pt",
      ];

      for (const locale of locales) {
        vi.clearAllMocks();
        await expect(loadLocale(locale)).resolves.toBeUndefined();
        expect(zConfig).toHaveBeenCalledTimes(1);
      }
    });
  });
});
