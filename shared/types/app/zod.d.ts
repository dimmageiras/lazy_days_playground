/**
 * TypeScript module augmentation for Zod
 * Replaces the original ZodFormattedError with our custom type
 */

import type { ISSUE_CODES } from "../../constants/zod.constant.ts";

/**
 * Common interface for formatted Zod errors
 */
interface BaseZodFormattedError {
  message: string;
  path: string;
  validation_code: (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES];
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
