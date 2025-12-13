import type { FastifyInstance } from "fastify";
import {
  fastifyZodOpenApiPlugin,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";

import { MODES } from "../../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { DatabaseInit } from "./database/index.ts";
import { SecurityInit } from "./security/index.ts";

const { TYPE_GENERATOR } = MODES;

const { log } = PinoLogHelper;

const { initDatabasePlugins } = DatabaseInit;
const { initSecurityPlugins } = SecurityInit;

const inits = async (app: FastifyInstance, mode: string): Promise<void> => {
  try {
    // Database plugins
    await initDatabasePlugins(app);

    // Zod plugins
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(fastifyZodOpenApiPlugin);

    if (mode !== TYPE_GENERATOR) {
      // Security plugins
      await initSecurityPlugins(app);
    }
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to initialize plugins"
    );
    process.exit(1);
  }

  if (mode !== TYPE_GENERATOR) {
    log.info("✅ All plugins are initialized");
  }
};

export { inits };
