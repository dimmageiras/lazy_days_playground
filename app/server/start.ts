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
} catch (rawError) {
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);

  if (!instance) {
    console.error(error);

    process.exit(1);
  }

  instance.log.fatal(
    { error: error.message, stack: error.stack },
    "💥 Failed to start the server",
  );

  try {
    await instance.close();
  } catch (rawCloseError) {
    const closeError =
      rawCloseError instanceof Error
        ? rawCloseError
        : new Error(`${rawCloseError}`);

    instance.log.fatal(
      { error: closeError.message, stack: closeError.stack },
      "💥 Failed to close the server after a startup failure",
    );
  }

  instance.log.flush(() => process.exit(1));
}
