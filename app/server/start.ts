import type { ViteAppEnv } from "@shared/types/app-env.type";

import { buildApp } from "./app";
import { EnvVarHelper } from "./helpers/env-var.helper";
import { ErrorHelper } from "./helpers/error.helper";
import { GracefulShutdownModule } from "./modules/graceful-shutdown";
import { LoggerModule } from "./modules/logger";
import type { AppInstance } from "./types/instance.type";

const { isEnvValidationError, validateEnv } = EnvVarHelper;
const { normalizeError } = ErrorHelper;
const { registerGracefulShutdown } = GracefulShutdownModule;
const { buildFallbackLogger } = LoggerModule;

let validatedEnv: ViteAppEnv;

try {
  validatedEnv = validateEnv(import.meta.env);
} catch (error) {
  const fallbackLogger = buildFallbackLogger();

  if (isEnvValidationError(error)) {
    fallbackLogger.fatal(
      normalizeError(error),
      "💥 Failed to validate the environment",
    );
  } else {
    fallbackLogger.fatal(
      normalizeError(error),
      "💥 Unexpected error while validating the environment",
    );
  }

  process.exit(1);
}

let instance: AppInstance | undefined;

try {
  instance = await buildApp(validatedEnv);

  const shutdownHandle = registerGracefulShutdown(instance);

  await instance.listen({ port: instance.appEnv.port });

  if (import.meta.hot) {
    const startedInstance = instance;

    import.meta.hot.dispose(async () => {
      shutdownHandle.uninstall();

      await startedInstance.close();
    });

    import.meta.hot.accept();
  }
} catch (rawError) {
  const normalizedError = normalizeError(rawError);

  if (!instance) {
    const fallbackLogger = buildFallbackLogger();

    fallbackLogger.fatal(normalizedError, "💥 Failed to start the server");

    process.exit(1);
  }

  instance.log.fatal(normalizedError, "💥 Failed to start the server");

  try {
    await instance.close();
  } catch (rawCloseError) {
    instance.log.fatal(
      normalizeError(rawCloseError),
      "💥 Failed to close the server after a startup failure",
    );
  }

  instance.log.flush(() => process.exit(1));
}
