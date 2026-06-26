import { ZOD } from "@server/constants/zod.constant";

import { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { ZodServerHelper } from "../zod-server.helper";

const { ENV_VALIDATION_ERROR_NAME } = ZOD;

const { getFormattedZodIssueLines } = ZodServerHelper;

const isEnvValidationError = (error: unknown): error is Error =>
  error instanceof Error && error.name === ENV_VALIDATION_ERROR_NAME;

const validateEnv = (env: ImportMetaEnv): ViteAppEnv => {
  const result = appEnvSchema.safeParse(env);

  if (result.success) {
    return result.data;
  }

  const error = new Error(
    `Environment variables:\n${getFormattedZodIssueLines(result.error.issues)}`,
  );

  error.name = ENV_VALIDATION_ERROR_NAME;

  throw error;
};

const EnvVarHelper = Object.freeze({
  isEnvValidationError,
  validateEnv,
} as const);

export { EnvVarHelper };
