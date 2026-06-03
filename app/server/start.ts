import { buildApp } from "./app";
import { EnvVarHelper } from "./helpers/env-var.helper";
import type { APIAppInstance } from "./types/instance.type";

const { validateEnv } = EnvVarHelper;

let instance: APIAppInstance;

try {
  const validatedEnv = validateEnv(import.meta.env);

  instance = buildApp(validatedEnv);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);

  process.exit(1);
}

try {
  await instance.listen({ port: instance.appEnv.port });
} catch (error) {
  instance.log.error(error);

  try {
    await instance.close();
  } catch (closeError) {
    instance.log.error(closeError);
  }

  process.exit(1);
}
