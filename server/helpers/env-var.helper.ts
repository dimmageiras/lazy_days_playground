import { MODE, MODES } from "../../shared/constants/root-env.constant.ts";
import { ZodUtilsHelper } from "../../shared/helpers/zod.helper.ts";
import { envSchema } from "../schemas/env-var.schema.ts";
import { PinoLogHelper } from "./pino-log.helper.ts";

const validateEnv = (): void => {
  const { TYPE_GENERATOR } = MODES;

  const { formatError } = ZodUtilsHelper;
  const { log } = PinoLogHelper;

  const result = envSchema.safeParse(process.env);

  if (result.success) {
    if (MODE !== TYPE_GENERATOR) {
      log.info("✅ Required environment variables are set...");
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
