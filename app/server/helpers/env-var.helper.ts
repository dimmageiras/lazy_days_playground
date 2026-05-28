import { appEnvSchema } from "@shared/schemas/app-env.schema";

import { ZodServerHelper } from "./zod-server.helper";

const { getFormattedZodIssues } = ZodServerHelper;

const validateEnv = (env: ImportMetaEnv): void => {
  const result = appEnvSchema.safeParse(env);

  if (result.success) {
    return;
  }

  const formattedErrors = getFormattedZodIssues(result.error.issues);

  throw new Error(
    `❌ Environment variables:\n${formattedErrors
      .map((issue) => `- ${issue.path}: ${issue.message}`)
      .join("\n")}`,
  );
};

const EnvVarHelper = Object.freeze({
  validateEnv,
} as const);

export { EnvVarHelper };
