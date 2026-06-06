import type { ViteAppEnv } from "@shared/types/app-env.type";

import { buildApp } from "./app";
import { EnvVarHelper } from "./helpers/env-var.helper";
import { GracefulShutdownModule } from "./modules/graceful-shutdown";
import { LoggerModule } from "./modules/logger";
import type { APIAppInstance } from "./types/instance.type";

const { isEnvValidationError, validateEnv } = EnvVarHelper;
const { registerGracefulShutdown } = GracefulShutdownModule;
const { buildFallbackLogger } = LoggerModule;

let validatedEnv: ViteAppEnv;

try {
  validatedEnv = validateEnv(import.meta.env);
} catch (error) {
  const fallbackLogger = buildFallbackLogger();

  if (isEnvValidationError(error)) {
    fallbackLogger.fatal(
      { error: error.message, stack: error.stack },
      "💥 Failed to validate the environment",
    );
  } else {
    const normalizedError =
      error instanceof Error ? error : new Error(`${error}`);

    fallbackLogger.fatal(
      { error: normalizedError.message, stack: normalizedError.stack },
      "💥 Unexpected error while validating the environment",
    );
  }

  process.exit(1);
}

let instance: APIAppInstance | undefined;

try {
  instance = await buildApp(validatedEnv);

  registerGracefulShutdown(instance);

  await instance.listen({ port: instance.appEnv.port });
} catch (rawError) {
  const error = rawError instanceof Error ? rawError : new Error(`${rawError}`);

  if (!instance) {
    const fallbackLogger = buildFallbackLogger();

    fallbackLogger.fatal(
      { error: error.message, stack: error.stack },
      "💥 Failed to start the server",
    );

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
