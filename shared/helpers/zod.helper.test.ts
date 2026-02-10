import type { KeyAsString } from "type-fest";
import { beforeAll, beforeEach, describe, it, vi } from "vitest";
import type { $ZodIssue } from "zod/v4/core";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import type { IssueCodes } from "@shared/types/app/zod";
import type {
  zConfig as zConfigType,
  ZodError,
  ZodFormattedError,
  ZodLocale,
} from "@shared/wrappers/zod.wrapper";

import { ZodUtilsHelper } from "./zod.helper";

// Mock zod wrapper to control imports
vi.mock("../wrappers/zod.wrapper", () => ({
  zConfig: vi.fn(),
}));

const {
  CUSTOM,
  INVALID_TYPE,
  INVALID_UNION,
  NOT_MULTIPLE_OF,
  TOO_BIG,
  TOO_SMALL,
  UNRECOGNIZED_KEYS,
} = ISSUE_CODES;

const { getObjectKeys } = ObjectUtilsHelper;
const { formatError, loadLocale } = ZodUtilsHelper;

// Factory functions for creating test data
const createIssue = (
  code: IssueCodes | string,
  overrides: Partial<$ZodIssue> = {},
): $ZodIssue => ({
  code,
  message: overrides.message ?? `Test message for ${code}`,
  path: overrides.path ?? ["test"],
  ...overrides,
});

const createExpectedError = (
  message: string,
  path: string | string[],
  validationCode: IssueCodes | string | undefined,
): ZodFormattedError => ({
  message,
  path: Array.isArray(path) ? path.join(".") : path,
  validation_code: validationCode,
});

const createScenario = (
  description: string,
  issues: $ZodIssue[],
  expected: ZodFormattedError[],
) => ({
  description,
  issues,
  expected,
});

// Test data constants using factories
const ISSUE_CODE_TEST_CASES = {
  INVALID_TYPE: {
    code: INVALID_TYPE,
    expected: INVALID_TYPE,
    extraProps: { expected: "string" },
  },
  INVALID_UNION: {
    code: INVALID_UNION,
    expected: INVALID_UNION,
    extraProps: { errors: [[], []] },
  },
  UNRECOGNIZED_KEYS: {
    code: UNRECOGNIZED_KEYS,
    expected: UNRECOGNIZED_KEYS,
    extraProps: { keys: ["extraKey"] },
  },
  TOO_SMALL: {
    code: TOO_SMALL,
    expected: TOO_SMALL,
    extraProps: { minimum: 1, origin: "number" },
  },
  TOO_BIG: {
    code: TOO_BIG,
    expected: TOO_BIG,
    extraProps: { maximum: 100, origin: "number" },
  },
  NOT_MULTIPLE_OF: {
    code: NOT_MULTIPLE_OF,
    expected: NOT_MULTIPLE_OF,
    extraProps: { divisor: 5 },
  },
  CUSTOM: {
    code: CUSTOM,
    expected: undefined,
    extraProps: {},
  },
} as const;

// Representative test cases for non-ISSUE_CODES error codes
const NON_ISSUE_CODE_TEST_CASES = {
  INVALID_DATE: "invalid_date",
  INVALID_STRING: "invalid_string",
} as const;

const FORMAT_ERROR_SCENARIOS = {
  SINGLE_ERROR: createScenario(
    "should format a single ZodError issue correctly",
    [
      createIssue("too_small", {
        message: "Number must be greater than or equal to 1",
        minimum: 1,
        origin: "number",
        path: ["age"],
      }),
    ],
    [
      createExpectedError(
        "Number must be greater than or equal to 1",
        "age",
        TOO_SMALL,
      ),
    ],
  ),

  MULTIPLE_ERRORS: createScenario(
    "should format multiple ZodError issues correctly",
    [
      createIssue("too_small", {
        message: "Number must be greater than or equal to 1",
        minimum: 1,
        origin: "number",
        path: ["age"],
      }),
      createIssue("invalid_type", {
        expected: "string",
        message: "Expected string, received number",
        path: ["name"],
      }),
    ],
    [
      createExpectedError(
        "Number must be greater than or equal to 1",
        "age",
        TOO_SMALL,
      ),
      createExpectedError(
        "Expected string, received number",
        "name",
        INVALID_TYPE,
      ),
    ],
  ),

  NESTED_PATH: createScenario(
    "should format nested path correctly",
    [
      createIssue("invalid_type", {
        expected: "string",
        message: "Expected string, received number",
        path: ["user", "profile", "name"],
      }),
    ],
    [
      createExpectedError(
        "Expected string, received number",
        "user.profile.name",
        INVALID_TYPE,
      ),
    ],
  ),

  CUSTOM_WITH_PARAMS: createScenario(
    "should handle custom error codes with params",
    [
      createIssue("custom", {
        message: "Custom validation failed",
        path: ["email"],
        params: { code: "invalid_email_format" },
      }),
    ],
    [
      createExpectedError(
        "Custom validation failed",
        "email",
        "invalid_email_format",
      ),
    ],
  ),

  CUSTOM_WITHOUT_PARAMS: createScenario(
    "should handle custom error codes without params",
    [
      createIssue("custom", {
        message: "Custom validation failed",
        path: ["field"],
        params: undefined,
      }),
    ],
    [createExpectedError("Custom validation failed", "field", undefined)],
  ),

  EMPTY_ISSUES: createScenario(
    "should return empty array for ZodError with no issues",
    [],
    [],
  ),

  EMPTY_PATH: createScenario(
    "should handle empty path correctly",
    [
      createIssue("invalid_type", {
        expected: "string",
        message: "Expected string, received number",
        path: [],
      }),
    ],
    [createExpectedError("Expected string, received number", "", INVALID_TYPE)],
  ),

  PRESERVE_ORDER: createScenario(
    "should preserve issue order",
    [
      createIssue("invalid_type", {
        expected: "string",
        message: "First error",
        path: ["first"],
      }),
      createIssue("too_small", {
        message: "Second error",
        minimum: 1,
        origin: "number",
        path: ["second"],
      }),
      createIssue("custom", {
        message: "Third error",
        path: ["third"],
      }),
    ],
    [
      createExpectedError("First error", "first", INVALID_TYPE),
      createExpectedError("Second error", "second", TOO_SMALL),
      createExpectedError("Third error", "third", undefined),
    ],
  ),
} as const;

// Test helper function to create mock ZodError with given issues
const createMockZodError = (issues: $ZodIssue[] = []): ZodError => ({
  _zod: {
    def: [],
    output: "ZodErrorTest",
  },
  addIssue: vi.fn(),
  addIssues: vi.fn(),
  cause: "ZodErrorTest",
  flatten: vi.fn(),
  format: vi.fn(),
  isEmpty: false,
  issues,
  message: "ZodErrorTest",
  name: "ZodErrorTest",
  stack: "ZodErrorTest",
  type: "ZodErrorTest",
});

// Test helper function to create test case issues
const createTestCase = (
  code: IssueCodes,
  extraProps: Record<string, unknown> = {},
) =>
  createIssue(code, {
    message: `Test message for ${code}`,
    path: ["test"],
    ...extraProps,
  });

// Test helper function to test format error scenarios
const testFormatErrorScenario = (
  key: KeyAsString<typeof FORMAT_ERROR_SCENARIOS>,
) => {
  const scenario = Reflect.get(FORMAT_ERROR_SCENARIOS, key);
  const { description, issues, expected } = scenario;

  it(description, ({ expect }) => {
    const mockZodError = createMockZodError(issues);
    const result = formatError(mockZodError);

    expect(result).toEqual(expected);
  });
};

// Test helper function to test issue code mappings
const testIssueCodeMapping = (
  key: KeyAsString<typeof ISSUE_CODE_TEST_CASES>,
) => {
  const testCase = Reflect.get(ISSUE_CODE_TEST_CASES, key);
  const { code, expected, extraProps } = testCase;

  it(`should format ${code} error code correctly`, ({ expect }) => {
    const mockZodError = createMockZodError([createTestCase(code, extraProps)]);

    const result = formatError(mockZodError);

    expect(result[0]?.validation_code).toBe(expected);
  });
};

// Test helper function to test non-ISSUE_CODES handling
// These codes are passed through as-is without special mapping
const testNonIssueCodeHandling = (
  key: KeyAsString<typeof NON_ISSUE_CODE_TEST_CASES>,
) => {
  const code = Reflect.get(NON_ISSUE_CODE_TEST_CASES, key);

  it(`should pass through ${code} error code without mapping`, ({ expect }) => {
    const mockZodError = createMockZodError([createTestCase(code)]);

    const result = formatError(mockZodError);

    expect(result[0]?.validation_code).toBe(code);
    expect(result[0]?.message).toBe(`Test message for ${code}`);
    expect(result[0]?.path).toBe("test");
  });
};

describe("ZodUtilsHelper", () => {
  describe("formatError", () => {
    // Data-driven tests for complex scenarios
    getObjectKeys(FORMAT_ERROR_SCENARIOS).forEach(testFormatErrorScenario);

    // Data-driven tests for ISSUE_CODES
    getObjectKeys(ISSUE_CODE_TEST_CASES).forEach(testIssueCodeMapping);

    // Data-driven tests for non-ISSUE_CODES
    getObjectKeys(NON_ISSUE_CODE_TEST_CASES).forEach(testNonIssueCodeHandling);
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

    it("should load all supported locales successfully", async ({ expect }) => {
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
