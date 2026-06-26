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
} = VitestSetup();

trackLeaksInSpec("zod-server.helper");

const { castAsType } = TypeHelper;

const { addCustomIssue, getFormattedZodIssueLines, getFormattedZodIssues } =
  ZodServerHelper;

const { createdIssueContext, ...TEST_DATA } = {
  BAD_VALUE: "bad value",
  EMPTY: "empty",
  FIELD: "field",
  INVALID_INPUT: "Invalid input",
  MUST_BE_ALLOWED_VALUES: "must be one of the allowed values",
  MUST_BE_SMALLER: "must be smaller",
  PORT: "port",
  SERVICE: "service",
  TOO_SMALL: "too small",
  get ADD_CUSTOM_ISSUE_CASES() {
    return [
      {
        code: ISSUE_CODES.INVALID_VALUE,
        expected: [
          {
            code: ISSUE_CODES.CUSTOM,
            message: this.MUST_BE_ALLOWED_VALUES,
            params: { code: ISSUE_CODES.INVALID_VALUE },
          },
        ],
        message: this.MUST_BE_ALLOWED_VALUES,
        name: "should raise a custom issue carrying the code in params",
      },
      {
        code: ISSUE_CODES.TOO_BIG,
        expected: [
          {
            code: ISSUE_CODES.CUSTOM,
            message: this.MUST_BE_SMALLER,
            params: { code: ISSUE_CODES.TOO_BIG },
          },
        ],
        message: this.MUST_BE_SMALLER,
        name: "should carry a different code through to params",
      },
    ];
  },
  get FORMAT_CASES() {
    return [
      {
        expected: EMPTY_ARRAY,
        issues: EMPTY_ARRAY,
        name: "should return an empty array for no issues",
      },
      {
        expected: [
          {
            message: this.INVALID_INPUT,
            path: this.PORT,
            validationCode: ISSUE_CODES.INVALID_TYPE,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.INVALID_TYPE,
            message: this.INVALID_INPUT,
            path: [this.PORT],
          }),
        ],
        name: "should pass a non-custom code straight through",
      },
      {
        expected: [
          {
            message: this.BAD_VALUE,
            path: this.FIELD,
            validationCode: ISSUE_CODES.INVALID_VALUE,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.CUSTOM,
            message: this.BAD_VALUE,
            params: { code: ISSUE_CODES.INVALID_VALUE },
            path: [this.FIELD],
          }),
        ],
        name: "should surface a known params code from a custom issue",
      },
      {
        expected: [
          {
            message: this.BAD_VALUE,
            path: this.FIELD,
            validationCode: ISSUE_CODES.CUSTOM,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.CUSTOM,
            message: this.BAD_VALUE,
            params: { code: "not_a_real_code" },
            path: [this.FIELD],
          }),
        ],
        name: "should fall back to custom for an unknown params code",
      },
      {
        expected: [
          {
            message: this.BAD_VALUE,
            path: this.FIELD,
            validationCode: ISSUE_CODES.CUSTOM,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.CUSTOM,
            message: this.BAD_VALUE,
            path: [this.FIELD],
          }),
        ],
        name: "should fall back to custom when params is absent",
      },
      {
        expected: [
          {
            message: this.INVALID_INPUT,
            path: "user[0].name",
            validationCode: ISSUE_CODES.INVALID_TYPE,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.INVALID_TYPE,
            message: this.INVALID_INPUT,
            path: ["user", 0, "name"],
          }),
        ],
        name: "should format a nested path with dot and bracket notation",
      },
      {
        expected: [
          {
            message: this.TOO_SMALL,
            path: this.PORT,
            validationCode: ISSUE_CODES.TOO_SMALL,
          },
          {
            message: this.EMPTY,
            path: this.SERVICE,
            validationCode: ISSUE_CODES.INVALID_VALUE,
          },
        ],
        issues: [
          castAsType<ZodIssue>({
            code: ISSUE_CODES.TOO_SMALL,
            message: this.TOO_SMALL,
            path: [this.PORT],
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
    ];
  },
  get FORMAT_LINES_CASES() {
    return [
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
            message: this.TOO_SMALL,
            path: [this.PORT],
          }),
          castAsType<ZodIssue>({
            code: ISSUE_CODES.CUSTOM,
            message: this.EMPTY,
            params: { code: ISSUE_CODES.INVALID_VALUE },
            path: [this.SERVICE],
          }),
        ],
        name: "should render one dash-prefixed line per issue joined by newlines",
      },
    ];
  },
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
          const { captured, context } = createdIssueContext();

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
