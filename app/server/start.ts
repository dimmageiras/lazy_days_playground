import type { ViteAppEnv } from "@shared/types/app-env.type";

import { buildApp } from "./app";
import { EnvVarHelper } from "./helpers/env-var.helper";
import type { APIAppInstance } from "./types/instance.type";

const { isEnvValidationError, validateEnv } = EnvVarHelper;

let validatedEnv: ViteAppEnv;

try {
  validatedEnv = validateEnv(import.meta.env);
} catch (error) {
  console.error(isEnvValidationError(error) ? error.message : error);

  process.exit(1);
}

let instance: APIAppInstance | undefined;

try {
  instance = await buildApp(validatedEnv);

  await instance.listen({ port: instance.appEnv.port });
} catch (error) {
  instance?.log.error(error);

  try {
    await instance?.close();
  } catch (closeError) {
    instance?.log.error(closeError);
  }

  process.exit(1);
}
