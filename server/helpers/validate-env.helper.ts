import { LOG_LEVELS } from "../../shared/constants/zod.constants.ts";
import {
  zCoerce,
  zEnum,
  zObject,
  zString,
} from "../../shared/wrappers/zod.wrapper.ts";
import { formatZodError } from "./zod.helper.ts";

const envSchema = zObject({
  VITE_APP_HOST: zString().min(1, { message: "String cannot be empty" }),
  VITE_APP_LOG_LEVEL: LOG_LEVELS,
  VITE_APP_IS_DEVELOPMENT: zEnum(["true", "false"], {
    message: 'VITE_APP_IS_DEVELOPMENT must be either "true" or "false"',
  }).optional(),
  VITE_APP_PORT: zCoerce
    .number()
    .int()
    .positive({ message: "PORT must be a positive integer" }),
});

const validateEnv = (): void => {
  const result = envSchema.safeParse(process.env);

  if (result.success) {
    console.info("✅ Required environment variables are set...");

    return;
  }

  const formattedErrors = formatZodError(result.error);

  throw new Error(
    `❌ Environment variables:\n${formattedErrors
      .map((err) => `- ${err.path}: ${err.message}`)
      .join("\n")}`
  );
};

export { validateEnv };
