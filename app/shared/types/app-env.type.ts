import type { CamelCase } from "type-fest";

import type { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { ZodInfer } from "@shared/wrappers/zod.wrapper";

type ViteAppEnv = ZodInfer<typeof appEnvSchema>;

type BindAllIpv4 = ViteAppEnv["VITE_APP_BIND_ALL_IPV4"];
type DbBranch = ViteAppEnv["VITE_APP_DB_BRANCH"];
type DbClientTlsSecurity = ViteAppEnv["VITE_APP_DB_CLIENT_TLS_SECURITY"];
type DbHost = ViteAppEnv["VITE_APP_DB_HOST"];
type DbName = ViteAppEnv["VITE_APP_DB_NAME"];
type DbPassword = ViteAppEnv["VITE_APP_DB_PASSWORD"];
type DbPort = ViteAppEnv["VITE_APP_DB_PORT"];
type IsDevelopment = ViteAppEnv["VITE_APP_IS_DEVELOPMENT"];
type LogLevel = ViteAppEnv["VITE_APP_LOG_LEVEL"];
type Port = ViteAppEnv["VITE_APP_PORT"];
type ServiceName = ViteAppEnv["VITE_APP_SERVICE_NAME"];
type ShutdownToken = ViteAppEnv["VITE_APP_SHUTDOWN_TOKEN"];

type AppEnv = {
  readonly [
    Key in keyof ViteAppEnv as Key extends `VITE_APP_${infer Suffix}`
      ? CamelCase<Suffix>
      : never
  ]: ViteAppEnv[Key];
};

export type {
  AppEnv,
  BindAllIpv4,
  DbBranch,
  DbClientTlsSecurity,
  DbHost,
  DbName,
  DbPassword,
  DbPort,
  IsDevelopment,
  LogLevel,
  Port,
  ServiceName,
  ShutdownToken,
  ViteAppEnv,
};
