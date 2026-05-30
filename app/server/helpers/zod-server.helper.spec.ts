import { describe } from "vitest";
import type { $ZodIssue } from "zod/v4/core";

import { VitestSetup } from "@configs/vitest/setup";

import type { CustomIssueContext } from "@server/types/zod.type";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { TypesHelper } from "@shared/helpers/types.helper";

import { ZodServerHelper } from "./zod-server.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("zod-server.helper");

const { castAsType } = TypesHelper;

const { addCustomIssue, getFormattedZodIssues } = ZodServerHelper;

type CapturedIssue = Parameters<CustomIssueContext["addIssue"]>[0];

const createIssueContext = (): {
  captured: Array<CapturedIssue>;
  context: CustomIssueContext;
} => {
  const captured: Array<CapturedIssue> = [];

  const context: CustomIssueContext = {
    addIssue: (issue): void => {
      captured.push(issue);
    },
  };

  return { captured, context };
};

const TEST_DATA = {
  ADD_CUSTOM_ISSUE_CASES: [
    {
      code: ISSUE_CODES.INVALID_VALUE,
      expected: [
        {
          code: ISSUE_CODES.CUSTOM,
          message: "must be one of the allowed values",
          params: { code: ISSUE_CODES.INVALID_VALUE },
        },
      ],
      message: "must be one of the allowed values",
      name: "should raise a custom issue carrying the code in params",
    },
    {
      code: ISSUE_CODES.TOO_BIG,
      expected: [
        {
          code: ISSUE_CODES.CUSTOM,
          message: "must be smaller",
          params: { code: ISSUE_CODES.TOO_BIG },
        },
      ],
      message: "must be smaller",
      name: "should raise a custom issue for a different code",
    },
  ],
  FORMAT_CASES: [
    {
      expected: [],
      issues: [],
      name: "should return an empty array for no issues",
    },
    {
      expected: [
        {
          message: "Invalid input",
          path: "VITE_APP_PORT",
          validationCode: "invalid_type",
        },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "invalid_type",
          message: "Invalid input",
          path: ["VITE_APP_PORT"],
        }),
      ],
      name: "should pass a non-custom code straight through",
    },
    {
      expected: [
        {
          message: "bad value",
          path: "field",
          validationCode: "invalid_value",
        },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "custom",
          message: "bad value",
          params: { code: "invalid_value" },
          path: ["field"],
        }),
      ],
      name: "should surface a known params.code from a custom issue",
    },
    {
      expected: [
        { message: "bad value", path: "field", validationCode: "custom" },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "custom",
          message: "bad value",
          params: { code: "not_a_real_code" },
          path: ["field"],
        }),
      ],
      name: "should fall back to custom for an unknown params.code",
    },
    {
      expected: [
        { message: "bad value", path: "field", validationCode: "custom" },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "custom",
          message: "bad value",
          path: ["field"],
        }),
      ],
      name: "should fall back to custom when params is absent",
    },
    {
      expected: [
        {
          message: "Invalid input",
          path: "user[0].name",
          validationCode: "invalid_type",
        },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "invalid_type",
          message: "Invalid input",
          path: ["user", 0, "name"],
        }),
      ],
      name: "should format a nested path with dot/bracket notation",
    },
    {
      expected: [
        {
          message: "too small",
          path: "VITE_APP_PORT",
          validationCode: "too_small",
        },
        {
          message: "empty",
          path: "VITE_APP_SERVICE_NAME",
          validationCode: "invalid_value",
        },
      ],
      issues: [
        castAsType<$ZodIssue>({
          code: "too_small",
          message: "too small",
          path: ["VITE_APP_PORT"],
        }),
        castAsType<$ZodIssue>({
          code: "custom",
          message: "empty",
          params: { code: "invalid_value" },
          path: ["VITE_APP_SERVICE_NAME"],
        }),
      ],
      name: "should format every issue in the list",
    },
  ],
} as const;

describe("ZodServerHelper", () => {
  describe("addCustomIssue", (it) => {
    TEST_DATA.ADD_CUSTOM_ISSUE_CASES.forEach(
      ({ name, code, expected, message }) => {
        it(name, ({ expect }) => {
          const { captured, context } = createIssueContext();

          addCustomIssue(context, message, code);

          expect(captured).toStrictEqual(expected);
        });
      },
    );
  });

  describe("getFormattedZodIssues", (it) => {
    TEST_DATA.FORMAT_CASES.forEach(({ name, issues, expected }) => {
      it(name, ({ expect }) => {
        expect(getFormattedZodIssues(issues)).toStrictEqual(expected);
      });
    });
  });
});
