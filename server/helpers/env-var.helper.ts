import { MODE, MODES } from "../../shared/constants/root-env.constant.ts";
import { ZodUtilsHelper } from "../../shared/helpers/zod.helper.ts";
import { envSchema } from "../schemas/env-var.schema.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const handleValidationSuccess = (): void => {
  if (MODE !== MODES.TYPE_GENERATOR) {
    PinoLogHelper.log.info("✅ Required environment variables are set...");
  }
};

const validateEnv = (): void => {
  const { formatError } = ZodUtilsHelper;

  const result = envSchema.safeParse(process.env);

  if (result.success) {
    handleValidationSuccess();

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
