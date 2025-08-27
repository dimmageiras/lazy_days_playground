/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

import type { LoggerOptions } from "pino";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_APP_ALL_DEV_TOOLS?: `${boolean}`;
      VITE_APP_HOST: string;
      VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
      VITE_APP_LOG_LEVEL: LoggerOptions["level"];
      VITE_APP_PORT: `${number}`;
      VITE_APP_RQDT?: `${boolean}`;
      VITE_APP_RRDT?: `${boolean}`;
    }
  }

  interface ImportMetaEnv {
    readonly VITE_APP_ALL_DEV_TOOLS?: `${boolean}`;
    readonly VITE_APP_HOST: string;
    readonly VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
    readonly VITE_APP_LOG_LEVEL: LoggerOptions["level"];
    readonly VITE_APP_PORT: `${number}`;
    readonly VITE_APP_RQDT?: `${boolean}`;
    readonly VITE_APP_RRDT?: `${boolean}`;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
