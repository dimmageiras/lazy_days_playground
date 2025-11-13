import { EnvVarHelper } from "./helpers/env-var.helper.ts";
import { PinoLogHelper } from "./helpers/pino-log.helper.ts";

try {
  const { validateEnv } = EnvVarHelper;

  validateEnv();
} catch (error) {
  const { log } = PinoLogHelper;

  log.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "💥 Failed to validate environment variables"
  );

  process.exit(1);
}

import("./start.ts");
