import { zNumber, zObject, zString } from "@shared/wrappers/zod.wrapper";

const portSchema = zString({
  error: (issue) =>
    issue.input === undefined ? "Is required" : "Must be a string",
})
  .transform(Number)
  .pipe(
    zNumber({ error: "Must be a number" })
      .int({ error: "Must be an integer" })
      .min(1, { error: "Must be between 1 and 65535" })
      .max(65535, { error: "Must be between 1 and 65535" }),
  )
  .brand<"Port">();

const serviceNameSchema = zString({
  error: (issue) =>
    issue.input === undefined ? "Is required" : "Must be a string",
})
  .min(1, { error: "Must not be empty" })
  .brand<"ServiceName">();

const appEnvSchema = zObject({
  VITE_APP_PORT: portSchema,
  VITE_APP_SERVICE_NAME: serviceNameSchema,
});

export { appEnvSchema };
