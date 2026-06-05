import { LOG_LEVEL } from "@shared/constants/log-level.constant";
import {
  zEnum,
  zNumber,
  zObject,
  zString,
  zStringbool,
} from "@shared/wrappers/zod.wrapper";

const IS_REQUIRED_MESSAGE = "Is required";
const MUST_BE_STRING_MESSAGE = "Must be a string";
const PORT_RANGE_MESSAGE = "Must be between 1 and 65535";

const isDevelopmentSchema = zStringbool({
  error: "Must be 'true' or 'false'",
  falsy: ["false"],
  truthy: ["true"],
})
  .default(false)
  .brand<"IsDevelopment">();

const logLevelSchema = zEnum(LOG_LEVEL.toArray(), {
  error: "Must be a known log level",
})
  .default("info")
  .brand<"LogLevel">();

const portSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .regex(/^\d+$/, { error: "Must be a string of digits" })
  .transform(Number)
  .pipe(
    zNumber({ error: "Must be a number" })
      .int({ error: "Must be an integer" })
      .min(1, { error: PORT_RANGE_MESSAGE })
      .max(65535, { error: PORT_RANGE_MESSAGE }),
  )
  .brand<"Port">();

const serviceNameSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .min(1, { error: "Must not be empty" })
  .brand<"ServiceName">();

const shutdownTokenSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .min(88, {
    error: String.raw`VITE_APP_SHUTDOWN_TOKEN must be at least 88 characters long (openssl rand -base64 64 | tr -d '\n')`,
  })
  .refine((val) => /^[A-Za-z0-9+/]+={0,2}$/.test(val), {
    error: String.raw`VITE_APP_SHUTDOWN_TOKEN must be base64 (e.g. from openssl rand -base64 64 | tr -d '\n')`,
  })
  .brand<"ShutdownToken">();

const appEnvSchema = zObject({
  VITE_APP_IS_DEVELOPMENT: isDevelopmentSchema,
  VITE_APP_LOG_LEVEL: logLevelSchema,
  VITE_APP_PORT: portSchema,
  VITE_APP_SERVICE_NAME: serviceNameSchema,
  VITE_APP_SHUTDOWN_TOKEN: shutdownTokenSchema,
});

export { appEnvSchema };
