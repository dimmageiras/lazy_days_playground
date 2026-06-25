import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { CustomIssueContext } from "@server/types/zod.type";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { ZodIssue } from "@shared/wrappers/zod.wrapper";

import { ZodServerHelper } from "./zod-server.helper";

const {
  sharedTestData: { EMPTY_ARRAY, EMPTY_STRING },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("zod-server.helper");

const { castAsType } = TypeHelper;

const { addCustomIssue, getFormattedZodIssueLines, getFormattedZodIssues } =
  ZodServerHelper;

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
      name: "should carry a different code through to params",
    },
  ],
  FORMAT_CASES: [
    {
      expected: EMPTY_ARRAY,
      issues: EMPTY_ARRAY,
      name: "should return an empty array for no issues",
    },
    {
      expected: [
        {
          message: "Invalid input",
          path: "port",
          validationCode: ISSUE_CODES.INVALID_TYPE,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.INVALID_TYPE,
          message: "Invalid input",
          path: ["port"],
        }),
      ],
      name: "should pass a non-custom code straight through",
    },
    {
      expected: [
        {
          message: "bad value",
          path: "field",
          validationCode: ISSUE_CODES.INVALID_VALUE,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.CUSTOM,
          message: "bad value",
          params: { code: ISSUE_CODES.INVALID_VALUE },
          path: ["field"],
        }),
      ],
      name: "should surface a known params code from a custom issue",
    },
    {
      expected: [
        {
          message: "bad value",
          path: "field",
          validationCode: ISSUE_CODES.CUSTOM,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.CUSTOM,
          message: "bad value",
          params: { code: "not_a_real_code" },
          path: ["field"],
        }),
      ],
      name: "should fall back to custom for an unknown params code",
    },
    {
      expected: [
        {
          message: "bad value",
          path: "field",
          validationCode: ISSUE_CODES.CUSTOM,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.CUSTOM,
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
          validationCode: ISSUE_CODES.INVALID_TYPE,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.INVALID_TYPE,
          message: "Invalid input",
          path: ["user", 0, "name"],
        }),
      ],
      name: "should format a nested path with dot and bracket notation",
    },
    {
      expected: [
        {
          message: "too small",
          path: "port",
          validationCode: ISSUE_CODES.TOO_SMALL,
        },
        {
          message: "empty",
          path: "service",
          validationCode: ISSUE_CODES.INVALID_VALUE,
        },
      ],
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.TOO_SMALL,
          message: "too small",
          path: ["port"],
        }),
        castAsType<ZodIssue>({
          code: ISSUE_CODES.CUSTOM,
          message: "empty",
          params: { code: ISSUE_CODES.INVALID_VALUE },
          path: ["service"],
        }),
      ],
      name: "should format every issue in the list",
    },
  ],
  FORMAT_LINES_CASES: [
    {
      expected: EMPTY_STRING,
      issues: EMPTY_ARRAY,
      name: "should render an empty string for no issues",
    },
    {
      expected: "- port: too small\n- service: empty",
      issues: [
        castAsType<ZodIssue>({
          code: ISSUE_CODES.TOO_SMALL,
          message: "too small",
          path: ["port"],
        }),
        castAsType<ZodIssue>({
          code: ISSUE_CODES.CUSTOM,
          message: "empty",
          params: { code: ISSUE_CODES.INVALID_VALUE },
          path: ["service"],
        }),
      ],
      name: "should render one dash-prefixed line per issue joined by newlines",
    },
  ],
  get createdIssueContext() {
    return () => {
      const captured: Array<Parameters<CustomIssueContext["addIssue"]>[0]> = [
        ...EMPTY_ARRAY,
      ];

      const context: CustomIssueContext = {
        addIssue: (issue): void => {
          captured.push(issue);
        },
      };

      return { captured, context };
    };
  },
} as const;

describe("ZodServerHelper", () => {
  describe("addCustomIssue", (it) => {
    TEST_DATA.ADD_CUSTOM_ISSUE_CASES.forEach(
      ({ code, expected, message, name }) => {
        it(name, ({ expect }) => {
          const { captured, context } = TEST_DATA.createdIssueContext();

          addCustomIssue(context, message, code);

          expect(captured).toStrictEqual(expected);
        });
      },
    );
  });

  describe("getFormattedZodIssues", (it) => {
    TEST_DATA.FORMAT_CASES.forEach(({ expected, issues, name }) => {
      it(name, ({ expect }) => {
        expect(getFormattedZodIssues(issues)).toStrictEqual(expected);
      });
    });
  });

  describe("getFormattedZodIssueLines", (it) => {
    TEST_DATA.FORMAT_LINES_CASES.forEach(({ expected, issues, name }) => {
      it(name, ({ expect }) => {
        expect(getFormattedZodIssueLines(issues)).toBe(expected);
      });
    });
  });
});
