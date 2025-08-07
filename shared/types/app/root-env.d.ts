/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

import type { LoggerOptions } from "pino";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_APP_HOST: string;
      VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
      VITE_APP_LOG_LEVEL: LoggerOptions["level"];
      VITE_APP_PORT: `${number}`;
    }
  }

  interface ImportMetaEnv {
    readonly VITE_APP_HOST: string;
    readonly VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
    readonly VITE_APP_LOG_LEVEL: LoggerOptions["level"];
    readonly VITE_APP_PORT: `${number}`;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
