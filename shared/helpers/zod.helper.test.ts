import type { KeyAsString } from "type-fest";
import type { TestAPI } from "vitest";
import { beforeAll, beforeEach, describe, vi } from "vitest";
import type { $ZodIssue } from "zod/v4/core";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
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

// Test helper function to test issue code mappings
const testIssueCodeMapping = (
  key: KeyAsString<typeof ISSUE_CODE_TEST_CASES>,
  it: TestAPI,
) => {
  const testCase = Reflect.get(ISSUE_CODE_TEST_CASES, key);
  const { code, expected, extraProps } = testCase;

  it(`should format ${code} error code correctly`, ({ expect }) => {
    const mockZodError = createMockZodError([createTestCase(code, extraProps)]);

    const result = formatError(mockZodError);

    expect(result[0]?.validation_code).toBe(expected);
  });
};

describe("ZodUtilsHelper", () => {
  describe("formatError", (it) => {
    // Data-driven tests for ISSUE_CODES
    getObjectKeys(ISSUE_CODE_TEST_CASES).forEach((key) =>
      testIssueCodeMapping(key, it),
    );
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
