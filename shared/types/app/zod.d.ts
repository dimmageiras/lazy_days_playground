/**
 * TypeScript module augmentation for Zod
 * Replaces the original ZodFormattedError with our custom type
 */

import type { ISSUE_CODES } from "../../constants/zod.constant.ts";

type IssueCodesKeys = KeyAsString<typeof ISSUE_CODES>;

type IssueCodes = (typeof ISSUE_CODES)[IssueCodesKeys];

/**
 * Common interface for formatted Zod errors
 */
interface BaseZodFormattedError {
  message: string;
  path: string;
  validation_code: IssueCodes;
}

declare module "zod" {
  /**
   * Custom ZodFormattedError interface that replaces the original
   */
  interface ZodFormattedError extends BaseZodFormattedError {
    [key: string]: unknown;
  }

  /**
   * Augment the namespace so z.ZodFormattedError also gets our custom type
   */
  namespace z {
    interface ZodFormattedError extends BaseZodFormattedError {
      [key: string]: unknown;
    }
  }
}
