import type { FastifyInstance } from "fastify";

import { ObjectUtilsHelper } from "../../../shared/helpers/object-utils.helper.ts";
import { SWAGGER_ROUTES } from "../../constants/swagger-routes.constant.ts";
import { PinoLogHelper } from "../../helpers/pino-log.helper.ts";
import { TypesHelper } from "../../helpers/types.helper.ts";

const { getObjectValues } = ObjectUtilsHelper;
const { log } = PinoLogHelper;
const { generateContractsForRoute } = TypesHelper;

const startTypeGenerationProcess = async (
  app: FastifyInstance,
  swaggerInstanceRef: { current: FastifyInstance | null }
): Promise<void> => {
  try {
    await app.ready();

    if (!swaggerInstanceRef.current) {
      throw new Error("Fastify instance with swagger not available");
    }

    const spec = swaggerInstanceRef.current.swagger();
    const routes = getObjectValues(SWAGGER_ROUTES);

    for (let index = 0; index < routes.length; index++) {
      const cleanOnFirstRun = index === 0;
      const routePath = Reflect.get(routes, index);

      if ("openapi" in spec) {
        await generateContractsForRoute({
          cleanOnFirstRun,
          routePath,
          spec: spec,
          isLastRoute: index === routes.length - 1,
        });
      }
    }

    process.exit(0);
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "💥 Failed to generate types"
    );
    process.exit(1);
  }
};

const initTypeGenerationPlugins = async (
  app: FastifyInstance,
  swaggerInstanceRef: { current: FastifyInstance | null }
): Promise<void> => {
  await startTypeGenerationProcess(app, swaggerInstanceRef);
};

export const TypeGenerationInit = {
  initTypeGenerationPlugins,
};
