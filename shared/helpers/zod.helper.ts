import type { IssueCodes } from "@shared/types/app/zod.js";

import { ISSUE_CODES } from "../constants/zod.constant.ts";
import type {
  ZodConfig,
  ZodError,
  ZodFormattedError,
  ZodLocale,
} from "../wrappers/zod.wrapper.ts";
import { zConfig } from "../wrappers/zod.wrapper.ts";

const formatError = (zodError: ZodError): ZodFormattedError[] => {
  return zodError.issues.map<ZodFormattedError>((error) => {
    const code: IssueCodes =
      error.code === ISSUE_CODES.CUSTOM ? error.params?.code : error.code;

    return {
      message: error.message,
      path: error.path.join("."),
      validation_code: code,
    };
  });
};

const loadLocale = async (language: ZodLocale): Promise<void> => {
  const { default: locale }: { default: () => ZodConfig } = await import(
    `zod/v4/locales/${language}.js`
  );

  zConfig(locale());
};

export const ZodUtilsHelper = { formatError, loadLocale };
