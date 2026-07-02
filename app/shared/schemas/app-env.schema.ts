import { DB_CLIENT_TLS_SECURITY } from "@shared/constants/db-client.constant";
import { HTTP_SCHEMES } from "@shared/constants/http.constant";
import { LOG_LEVEL } from "@shared/constants/log-level.constant";
import {
  zBase64,
  zEnum,
  zIpv4,
  zNumber,
  zObject,
  zString,
  zStringbool,
  zUrl,
} from "@shared/wrappers/zod.wrapper";

const { HTTP } = HTTP_SCHEMES;

const IPV4_ADDRESS_MESSAGE = "Must be a valid IPv4 address";
const IS_REQUIRED_MESSAGE = "Is required";
const MUST_BE_STRING_MESSAGE = "Must be a string";
const PORT_RANGE_MESSAGE = "Must be between 1 and 65535";

const ipv4Schema = zIpv4();

const isHost = (value: string): boolean => {
  const candidate = `${HTTP}://${value}`;

  return (
    zUrl().safeParse(candidate).success &&
    new URL(candidate).hostname === value
  );
};

const isIpv4 = (value: string): boolean => {
  return ipv4Schema.safeParse(value).success;
};

const brandedIpSchema = <Brand extends string>(
  isIp: (value: string) => boolean,
  message: string,
) =>
  zString({
    error: (issue) =>
      issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
  })
    .refine(isIp, { error: message })
    .brand<Brand>();

const bindAllIpv4Schema = brandedIpSchema<"BindAllIpv4">(
  isIpv4,
  IPV4_ADDRESS_MESSAGE,
);

const dbBranchSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .min(1, { error: "Must not be empty" })
  .brand<"DbBranch">();

const dbClientTlsSecuritySchema = zEnum(DB_CLIENT_TLS_SECURITY.toArray(), {
  error: "Must be a known TLS security mode",
}).brand<"DbClientTlsSecurity">();

const dbHostSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .transform((value) => value.toLowerCase())
  .refine(isHost, { error: "Must be a valid IPv4 address or hostname" })
  .brand<"DbHost">();

const dbNameSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .min(1, { error: "Must not be empty" })
  .brand<"DbName">();

const dbPasswordSchema = zString({
  error: (issue) =>
    issue.input === undefined ? IS_REQUIRED_MESSAGE : MUST_BE_STRING_MESSAGE,
})
  .min(1, { error: "Must not be empty" })
  .brand<"DbPassword">();

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
  .min(88, { error: "Must be at least 88 characters" })
  .pipe(zBase64({ error: "Must be base64" }))
  .brand<"ShutdownToken">();

const appEnvSchema = zObject({
  VITE_APP_BIND_ALL_IPV4: bindAllIpv4Schema,
  VITE_APP_DB_BRANCH: dbBranchSchema,
  VITE_APP_DB_CLIENT_TLS_SECURITY: dbClientTlsSecuritySchema,
  VITE_APP_DB_HOST: dbHostSchema,
  VITE_APP_DB_NAME: dbNameSchema,
  VITE_APP_DB_PASSWORD: dbPasswordSchema,
  VITE_APP_DB_PORT: portSchema,
  VITE_APP_IS_DEVELOPMENT: isDevelopmentSchema,
  VITE_APP_LOG_LEVEL: logLevelSchema,
  VITE_APP_PORT: portSchema,
  VITE_APP_SERVICE_NAME: serviceNameSchema,
  VITE_APP_SHUTDOWN_TOKEN: shutdownTokenSchema,
});

export { appEnvSchema };
