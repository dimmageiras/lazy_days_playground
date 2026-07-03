import type { ISSUE_CODES } from "@shared/constants/zod.constant";

type IssueCodes = (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES];

interface CustomIssueContext {
  addIssue: (issue: {
    code: (typeof ISSUE_CODES)["CUSTOM"];
    message: string;
    params: { code: IssueCodes };
  }) => void;
}

interface ZodIssueDto {
  message: string;
  path: string;
  validationCode: IssueCodes;
}

export type { CustomIssueContext, IssueCodes, ZodIssueDto };
