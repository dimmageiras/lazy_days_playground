import type { KeyAsString } from "type-fest";
import type { $ZodFormattedError } from "zod/v4/core";

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
  interface ZodFormattedError<T, U = string>
    extends BaseZodFormattedError, $ZodFormattedError<T, U> {}

  /**
   * Augment the namespace so z.ZodFormattedError also gets our custom type
   */
  namespace z {
    interface ZodFormattedError<T, U = string>
      extends BaseZodFormattedError, $ZodFormattedError<T, U> {}
  }
}
