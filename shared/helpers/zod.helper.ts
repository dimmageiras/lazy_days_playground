import { ISSUE_CODES } from "../constants/zod.constant.ts";
import type { ZodError, ZodFormattedError } from "../wrappers/zod.wrapper.ts";

const formatError = (zodError: ZodError): ZodFormattedError[] => {
  return zodError.issues.map((error) => {
    const code =
      error.code === ISSUE_CODES.CUSTOM ? error.params?.code : error.code;

    return {
      path: error.path.join("."),
      message: error.message,
      validation_code: code,
    };
  });
};

export const ZodUtilsHelper = { formatError };
