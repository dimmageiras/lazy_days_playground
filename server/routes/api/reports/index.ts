import type { FastifyInstance } from "fastify";

import { cspReportsRoute } from "./csp/index.ts";

const reportsRoute = async (fastify: FastifyInstance): Promise<void> => {
  await cspReportsRoute(fastify);
};

export { reportsRoute };
