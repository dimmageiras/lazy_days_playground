import type { FastifyInstance } from "fastify";
import {
  fastifyZodOpenApiPlugin,
  serializerCompiler,
  validatorCompiler,
} from "fastify-zod-openapi";

import { MODE, MODES } from "../../shared/constants/root-env.constant.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { DatabaseInit } from "./database/index.ts";
import { ReactRouterInit } from "./react-router/index.ts";
import { RoutesInit } from "./routes/index.ts";
import { SecurityInit } from "./security/index.ts";
import { SwaggerInit } from "./swagger/index.ts";
import { TypeGenerationInit } from "./type-generation/index.ts";

const { TYPE_GENERATOR } = MODES;

const { log } = PinoLogHelper;

const { initDatabasePlugins } = DatabaseInit;
const { initReactRouterPlugins } = ReactRouterInit;
const { initRoutesPlugins } = RoutesInit;
const { initSecurityPlugins } = SecurityInit;
const { initSwaggerPlugins } = SwaggerInit;
const { initTypeGenerationPlugins } = TypeGenerationInit;

const inits = async (app: FastifyInstance): Promise<void> => {
  const swaggerInstanceRef: { current: FastifyInstance | null } = {
    current: null,
  };

  try {
    // Database plugins
    await initDatabasePlugins(app);

    // Zod plugins
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(fastifyZodOpenApiPlugin);

    if (MODE !== TYPE_GENERATOR) {
      // Security plugins
      await initSecurityPlugins(app);
    }

    // Swagger plugins
    await initSwaggerPlugins(app, swaggerInstanceRef, initRoutesPlugins);

    // Type generation plugins (only in type generator mode)
    if (MODE === TYPE_GENERATOR) {
      await initTypeGenerationPlugins(app, swaggerInstanceRef);
    }

    // React Router plugins
    await initReactRouterPlugins(app);
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

  if (MODE !== TYPE_GENERATOR) {
    log.info("✅ All plugins are initialized");
  }
};

export { inits };
