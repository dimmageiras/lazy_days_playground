import type { FastifyInstance } from "fastify";

import { meRoute } from "./me/index.ts";
import { signinRoute } from "./signin/index.ts";
import { signupRoute } from "./signup/index.ts";
import { verifyRoute } from "./verify/index.ts";

const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await meRoute(fastify);
  await signinRoute(fastify);
  await signupRoute(fastify);
  await verifyRoute(fastify);
};

export { authRoutes };
