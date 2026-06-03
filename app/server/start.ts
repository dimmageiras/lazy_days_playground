import type { ViteAppEnv } from "@shared/types/app-env.type";

import { buildApp } from "./app";
import { EnvVarHelper } from "./helpers/env-var.helper";

const { validateEnv } = EnvVarHelper;

let validatedEnv: ViteAppEnv;

try {
  validatedEnv = validateEnv(import.meta.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exit(1);
}

const instance = buildApp(validatedEnv);

try {
  await instance.listen({ port: validatedEnv.VITE_APP_PORT });
} catch (error) {
  instance.log.error(error);

  try {
    await instance.close();
  } catch (closeError) {
    instance.log.error(closeError);
  }

  process.exit(1);
}
