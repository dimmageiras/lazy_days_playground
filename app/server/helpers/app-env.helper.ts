import type { AppEnv, ViteAppEnv } from "@shared/types/app-env.type";

const buildAppEnv = (env: ViteAppEnv): AppEnv => {
  const appEnv = Object.freeze({
    bindAllIpv4: env.VITE_APP_BIND_ALL_IPV4,
    isDevelopment: env.VITE_APP_IS_DEVELOPMENT,
    logLevel: env.VITE_APP_LOG_LEVEL,
    port: env.VITE_APP_PORT,
    serviceName: env.VITE_APP_SERVICE_NAME,
    shutdownToken: env.VITE_APP_SHUTDOWN_TOKEN,
  } as const);

  return appEnv;
};

const AppEnvHelper = Object.freeze({
  buildAppEnv,
} as const);

export { AppEnvHelper };
