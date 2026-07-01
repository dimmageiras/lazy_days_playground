import { Set } from "immutable";

import type {
  CustomIssueContext,
  IssueCodes,
  ZodIssueDto,
} from "@server/types/zod.type";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { ObjectHelper } from "@shared/helpers/object.helper";
import { SetHelper } from "@shared/helpers/set.helper";
import { StringHelper } from "@shared/helpers/string.helper";
import type { ZodIssue } from "@shared/wrappers/zod.wrapper";
import { zToDotPath } from "@shared/wrappers/zod.wrapper";

const { getObjectValues } = ObjectHelper;
const { hasSetValue } = SetHelper;
const { isString } = StringHelper;

const ISSUE_CODE_VALUES = Set(getObjectValues(ISSUE_CODES));

const isIssueCode = (value: unknown): value is IssueCodes =>
  isString(value) && hasSetValue(ISSUE_CODE_VALUES, value);

const addCustomIssue = (
  context: CustomIssueContext,
  message: string,
  code: IssueCodes,
): void => {
  context.addIssue({
    code: ISSUE_CODES.CUSTOM,
    message,
    params: { code },
  });
};

const getFormattedZodIssues = (
  issues: ReadonlyArray<ZodIssue>,
): Array<ZodIssueDto> =>
  issues.map<ZodIssueDto>((issue) => {
    const customCode: unknown =
      issue.code === ISSUE_CODES.CUSTOM ? issue.params?.code : undefined;

    const validationCode: IssueCodes = isIssueCode(customCode)
      ? customCode
      : issue.code;

    return {
      message: issue.message,
      path: zToDotPath(issue.path),
      validationCode,
    };
  });

const getFormattedZodIssueLines = (issues: ReadonlyArray<ZodIssue>): string =>
  getFormattedZodIssues(issues)
    .map((issue) => `- ${issue.path}: ${issue.message}`)
    .join("\n");

const ZodServerHelper = Object.freeze({
  addCustomIssue,
  getFormattedZodIssueLines,
  getFormattedZodIssues,
} as const);

export { ZodServerHelper };
