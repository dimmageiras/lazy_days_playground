/// <reference types="vite/client" />
/// <reference types="vitest/config" />

interface EnvironmentVariables {
  VITE_APP_PORT: `${number}`;
  VITE_APP_SERVICE_NAME: string;
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
