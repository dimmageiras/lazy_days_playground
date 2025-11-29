/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

import type { CipherGCMTypes } from "crypto";
import type { LoggerOptions } from "pino";

import type { MODES } from "@shared/constants/root-env.constant";

interface EnvironmentVariables {
  AUTH_TAG_LENGTH: `${number}`;
  COOKIE_SECRET: string;
  GEL_AUTH_BASE_URL: string;
  GEL_DSN: string;
  IV_LENGTH: `${number}`;
  KEY_LENGTH: `${number}`;
  LOG_LEVEL: LoggerOptions["level"];
  SALT_LENGTH: `${number}`;
  SSR: boolean;
  TOKEN_ENCRYPTION_METHOD: CipherGCMTypes;
  VITE_APP_ALL_DEV_TOOLS?: `${boolean}`;
  VITE_APP_HOST: string;
  VITE_APP_IS_DEVELOPMENT?: `${boolean}`;
  VITE_APP_PORT: `${number}`;
  VITE_APP_RQDT?: `${boolean}`;
  VITE_APP_RRDT?: `${boolean}`;
  VITE_APP_TYPE_GENERATOR_MODE?: typeof MODES.TYPE_GENERATOR;
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
