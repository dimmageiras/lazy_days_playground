import { LOG_LEVEL } from "@shared/constants/log-level.constant";
import {
  zEnum,
  zNumber,
  zObject,
  zString,
  zStringbool,
} from "@shared/wrappers/zod.wrapper";

const PORT_RANGE_MESSAGE = "Must be between 1 and 65535";

const isDevelopmentSchema = zStringbool({
  truthy: ["true"],
  falsy: ["false"],
  error: "Must be 'true' or 'false'",
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
    issue.input === undefined ? "Is required" : "Must be a string",
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
    issue.input === undefined ? "Is required" : "Must be a string",
})
  .min(1, { error: "Must not be empty" })
  .brand<"ServiceName">();

const appEnvSchema = zObject({
  VITE_APP_IS_DEVELOPMENT: isDevelopmentSchema,
  VITE_APP_LOG_LEVEL: logLevelSchema,
  VITE_APP_PORT: portSchema,
  VITE_APP_SERVICE_NAME: serviceNameSchema,
});

export { appEnvSchema };
