import type { AppEnv, ViteAppEnv } from "@shared/types/app-env.type";

const buildAppEnv = (env: ViteAppEnv): AppEnv => {
  const appEnv = Object.freeze({
    port: env.VITE_APP_PORT,
    serviceName: env.VITE_APP_SERVICE_NAME,
  });

  return appEnv;
};

const AppEnvHelper = Object.freeze({
  buildAppEnv,
} as const);

export { AppEnvHelper };
