import {
  zCoerce,
  zEnum,
  zObject,
  zString,
} from "../../shared/wrappers/zod.wrapper.ts";

const envSchema = zObject({
  GEL_AUTH_BASE_URL: zString().min(1, {
    message: "VITE_APP_GEL_AUTH_BASE_URL is required for auth connection",
  }),
  GEL_DSN: zString().min(1, {
    message: "VITE_APP_GEL_DSN is required for database connection",
  }),
  VITE_APP_ALL_DEV_TOOLS: zEnum(["true", "false"], {
    message: 'VITE_APP_ALL_DEV_TOOLS must be either "true" or "false"',
  }).optional(),
  VITE_APP_COOKIE_SECRET: zString().min(32, {
    message: "VITE_APP_COOKIE_SECRET must be at least 32 characters long",
  }),
  VITE_APP_HOST: zString().min(1, { message: "String cannot be empty" }),
  VITE_APP_IS_DEVELOPMENT: zEnum(["true", "false"], {
    message: 'VITE_APP_IS_DEVELOPMENT must be either "true" or "false"',
  }).optional(),
  VITE_APP_JWT_REFRESH_SECRET: zString().min(32, {
    message: "VITE_APP_JWT_REFRESH_SECRET must be at least 32 characters long",
  }),
  VITE_APP_JWT_SECRET: zString().min(32, {
    message: "VITE_APP_JWT_SECRET must be at least 32 characters long",
  }),
  VITE_APP_LOG_LEVEL: zEnum([
    "debug",
    "error",
    "fatal",
    "info",
    "silent",
    "trace",
    "warn",
  ]),
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

export { envSchema };
