import { zCoerce, zObject } from "@shared/wrappers/zod.wrapper";

const PortSchema = zCoerce
  .number({ error: "Must be a number" })
  .int({ error: "Must be an integer" })
  .min(1, { error: "Must be between 1 and 65535" })
  .max(65535, { error: "Must be between 1 and 65535" })
  .brand<"Port">();

const appEnvSchema = zObject({
  VITE_APP_PORT: PortSchema,
});

export { appEnvSchema };
