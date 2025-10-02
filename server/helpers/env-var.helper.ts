import { MODE, MODES } from "../../shared/constants/root-env.constant.ts";
import { ZodUtilsHelper } from "../../shared/helpers/zod.helper.ts";
import { envSchema } from "../schemas/env-var.schema.ts";

const validateEnv = (): void => {
  const { formatError } = ZodUtilsHelper;

  const result = envSchema.safeParse(process.env);

  if (result.success) {
    if (MODE !== MODES.TYPE_GENERATOR) {
      console.info("✅ Required environment variables are set...");
    }

    return;
  }

  const formattedErrors = formatError(result.error);

  throw new Error(
    `❌ Environment variables:\n${formattedErrors
      .map((err) => `- ${err.path}: ${err.message}`)
      .join("\n")}`
  );
};

export const EnvVarHelper = { validateEnv };
