import { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { ZodServerHelper } from "./zod-server.helper";

const { getFormattedZodIssues } = ZodServerHelper;

const validateEnv = (env: ImportMetaEnv): ViteAppEnv => {
  const result = appEnvSchema.safeParse(env);

  if (result.success) {
    return result.data;
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
