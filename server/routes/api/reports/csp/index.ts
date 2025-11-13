import type { FastifyInstance } from "fastify";

import { clearRoute } from "./clear/index.ts";
import { createRoute } from "./create/index.ts";
import { listRoute } from "./list/index.ts";

const cspReportsRoute = async (fastify: FastifyInstance): Promise<void> => {
  await clearRoute(fastify);
  await createRoute(fastify);
  await listRoute(fastify);
};

export { cspReportsRoute };
