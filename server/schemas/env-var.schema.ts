import { MODES } from "../../shared/constants/root-env.constant.ts";
import {
  zCoerce,
  zEnum,
  zObject,
  zString,
} from "../../shared/wrappers/zod.wrapper.ts";

const envSchema = zObject({
  AUTH_TAG_LENGTH: zCoerce
    .number()
    .int()
    .positive({ message: "AUTH_TAG_LENGTH must be a positive integer" }),
  COOKIE_SECRET: zString().min(32, {
    message: "VITE_APP_COOKIE_SECRET must be at least 32 characters long",
  }),
  GEL_AUTH_BASE_URL: zString().min(1, {
    message: "VITE_APP_GEL_AUTH_BASE_URL is required for auth connection",
  }),
  GEL_DSN: zString().min(1, {
    message: "VITE_APP_GEL_DSN is required for database connection",
  }),
  IV_LENGTH: zCoerce
    .number()
    .int()
    .positive({ message: "IV_LENGTH must be a positive integer" }),
  KEY_LENGTH: zCoerce
    .number()
    .int()
    .positive({ message: "KEY_LENGTH must be a positive integer" }),
  LOG_LEVEL: zEnum([
    "debug",
    "error",
    "fatal",
    "info",
    "silent",
    "trace",
    "warn",
  ]),
  SALT_LENGTH: zCoerce
    .number()
    .int()
    .positive({ message: "SALT_LENGTH must be a positive integer" }),
  TOKEN_ENCRYPTION_METHOD: zString().min(1, {
    message:
      "VITE_APP_TOKEN_ENCRYPTION_METHOD is required for token encryption",
  }),
  VITE_APP_ALL_DEV_TOOLS: zEnum(["true", "false"], {
    message: 'VITE_APP_ALL_DEV_TOOLS must be either "true" or "false"',
  }).optional(),
  VITE_APP_HOST: zString().min(1, { message: "String cannot be empty" }),
  VITE_APP_IS_DEVELOPMENT: zEnum(["true", "false"], {
    message: 'VITE_APP_IS_DEVELOPMENT must be either "true" or "false"',
  }).optional(),
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
  VITE_APP_TYPE_GENERATOR_MODE: zEnum(Object.values(MODES), {
    message:
      "VITE_APP_TYPE_GENERATOR_MODE must be one of the following: " +
      Object.values(MODES).join(", "),
  }).optional(),
});

export { envSchema };
