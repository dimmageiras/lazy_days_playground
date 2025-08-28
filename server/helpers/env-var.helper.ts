import { LOG_LEVELS } from "../../shared/constants/zod.constant.ts";
import { ZodUtilsHelper } from "../../shared/helpers/zod.helper.ts";
import {
  zCoerce,
  zEnum,
  zObject,
  zString,
} from "../../shared/wrappers/zod.wrapper.ts";

const envSchema = zObject({
  VITE_APP_ALL_DEV_TOOLS: zEnum(["true", "false"], {
    message: 'VITE_APP_ALL_DEV_TOOLS must be either "true" or "false"',
  }).optional(),
  VITE_APP_HOST: zString().min(1, { message: "String cannot be empty" }),
  VITE_APP_IS_DEVELOPMENT: zEnum(["true", "false"], {
    message: 'VITE_APP_IS_DEVELOPMENT must be either "true" or "false"',
  }).optional(),
  VITE_APP_LOG_LEVEL: LOG_LEVELS,
  VITE_APP_PORT: zCoerce
    .number()
    .int()
    .positive({ message: "PORT must be a positive integer" }),
  VITE_APP_RQDT: zEnum(["true", "false"], {
    message: 'VITE_APP_RQDT must be either "true" or "false"',
  }).optional(),
  VITE_APP_RRDT: zEnum(["true", "false"], {
    message: 'VITE_APP_RRDT must be either "true" or "false"',
  }).optional(),
});

const validateEnv = (): void => {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    console.info("✅ Required environment variables are set...");

    return;
  }

  const { formatError } = ZodUtilsHelper;

  const formattedErrors = formatError(result.error);

  throw new Error(
    `❌ Environment variables:\n${formattedErrors
      .map((err) => `- ${err.path}: ${err.message}`)
      .join("\n")}`
  );
};

export const EnvVarHelper = { validateEnv };
