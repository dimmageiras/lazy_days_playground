/// <reference types="vite/client" />

import type { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { ZodInput } from "@shared/wrappers/zod.wrapper";

declare global {
  interface ImportMetaEnv extends ZodInput<typeof appEnvSchema> {
    [key: string]: unknown;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
