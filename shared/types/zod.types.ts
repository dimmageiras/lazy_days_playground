import type { ISSUE_CODES } from "@shared/constants/zod.constants";

interface ZodFormattedError {
  message: string;
  path: string;
  validation_code: (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES];
}

export type { ZodFormattedError };
