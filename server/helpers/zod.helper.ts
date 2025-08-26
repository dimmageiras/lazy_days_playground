import type { $ZodError } from "zod/v4/core";

import { ISSUE_CODES } from "../../shared/constants/zod.constant.ts";
import type { ZodFormattedError } from "../../shared/types/zod.type.ts";

const formatZodError = (zodError: $ZodError): ZodFormattedError[] => {
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

export { formatZodError };
