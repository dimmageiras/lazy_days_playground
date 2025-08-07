import { validateEnv } from "./helpers/validate-env.helper.ts";

try {
  validateEnv();
} catch (error) {
  console.error(error);

  process.exit(1);
}

import("./start.ts");
