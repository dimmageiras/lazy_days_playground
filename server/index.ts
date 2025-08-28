import { EnvVarHelper } from "./helpers/env-var.helper.ts";

try {
  const { validateEnv } = EnvVarHelper;

  validateEnv();
} catch (error) {
  console.error(error);

  process.exit(1);
}

import("./start.ts");
