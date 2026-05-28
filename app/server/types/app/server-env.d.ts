/// <reference types="vite/client" />
/// <reference types="vitest/config" />

interface EnvironmentVariables {
  VITE_APP_HOST: string;
  VITE_APP_PORT: `${number}`;
  VITE_LOOPBACK_HOST_V4_MAPPED: string;
}

declare global {
  interface ImportMetaEnv extends EnvironmentVariables {
    [key: string]: unknown;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
