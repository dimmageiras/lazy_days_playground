/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

import type { LoggerOptions } from "pino";

interface EnvironmentVariables {
  VITE_APP_ALL_DEV_TOOLS?: `${boolean}`;
  VITE_APP_COOKIE_SECRET: string;
  VITE_APP_GEL_DSN: string;
  VITE_APP_HOST: string;
  VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
  VITE_APP_JWT_REFRESH_SECRET: string;
  VITE_APP_JWT_SECRET: string;
  VITE_APP_LOG_LEVEL: LoggerOptions["level"];
  VITE_APP_PORT: `${number}`;
  VITE_APP_RQDT?: `${boolean}`;
  VITE_APP_RRDT?: `${boolean}`;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvironmentVariables {
      [key: string]: unknown;
    }
  }

  interface ImportMetaEnv extends EnvironmentVariables {
    [key: string]: unknown;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
