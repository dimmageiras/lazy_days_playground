import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppHelper } from "./helpers/app.helper";
import { EnvVarHelper } from "./helpers/env-var.helper";
import { ErrorHelper } from "./helpers/error.helper";
import { LoggerModule } from "./modules/logger";
import { ShutdownModule } from "./modules/shutdown";
import { StartupModule } from "./modules/startup";
import type { AppInstance } from "./types/instance.type";

const { build } = AppHelper;
const { isEnvValidationError, validateEnv } = EnvVarHelper;
const { normalizeError } = ErrorHelper;

const { buildFallbackLogger, buildLogger } = LoggerModule;
const { redactPaths, setupShutdown } = ShutdownModule;
const { claimPort } = StartupModule;

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
  instance = await build(validatedEnv, import.meta.hot, {
    logger: {
      buildLogger,
    },
    shutdown: {
      redactPaths,
      setupShutdown,
    },
  });

  await claimPort(instance);
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
