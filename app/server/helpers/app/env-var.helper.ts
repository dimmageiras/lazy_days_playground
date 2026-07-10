import { ENV_VALIDATION } from "@server/constants/env-validation.constant";

import { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { ZodServerHelper } from "../zod-server.helper";

const { ERROR_NAME } = ENV_VALIDATION;

const { getFormattedZodIssueLines } = ZodServerHelper;

const isEnvValidationError = (error: unknown): error is Error =>
  error instanceof Error && error.name === ERROR_NAME;

const validateEnv = (env: ImportMetaEnv): ViteAppEnv => {
  const result = appEnvSchema.safeParse(env);

  if (result.success) {
    return result.data;
  }

  const error = new Error(
    `Environment variables:\n${getFormattedZodIssueLines(result.error.issues)}`,
  );

  error.name = ERROR_NAME;

  throw error;
};

const EnvVarHelper = Object.freeze({
  isEnvValidationError,
  validateEnv,
} as const);

export { EnvVarHelper };
