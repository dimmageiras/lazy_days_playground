import type {
  CustomIssueContext,
  IssueCodes,
  ZodIssueDto,
} from "@server/types/zod.type";
import { Set } from "immutable";
import type { $ZodIssue } from "zod/v4/core";
import { toDotPath } from "zod/v4/core";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { ObjectHelper } from "@shared/helpers/object.helper";
import { SetHelper } from "@shared/helpers/set.helper";

const { getObjectValues } = ObjectHelper;
const { hasSetValue } = SetHelper;

const ISSUE_CODE_VALUES = Set(getObjectValues(ISSUE_CODES));

const isIssueCode = (value: unknown): value is IssueCodes =>
  typeof value === "string" && hasSetValue(ISSUE_CODE_VALUES, value);

const addCustomIssue = (
  context: CustomIssueContext,
  message: string,
  code: IssueCodes,
): void => {
  context.addIssue({ code: ISSUE_CODES.CUSTOM, message, params: { code } });
};

const getFormattedZodIssues = (
  issues: ReadonlyArray<$ZodIssue>,
): Array<ZodIssueDto> =>
  issues.map<ZodIssueDto>((issue) => {
    const customCode: unknown =
      issue.code === ISSUE_CODES.CUSTOM ? issue.params?.code : undefined;

    const validationCode: IssueCodes = isIssueCode(customCode)
      ? customCode
      : issue.code;

    return {
      message: issue.message,
      path: toDotPath(issue.path),
      validationCode,
    };
  });

const ZodServerHelper = Object.freeze({
  addCustomIssue,
  getFormattedZodIssues,
} as const);

export { ZodServerHelper };
