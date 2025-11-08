import type { FastifyInstance } from "fastify";

import { signinRoute } from "./signin/index.ts";
import { signupRoute } from "./signup/index.ts";
import { verifyRoute } from "./verify/index.ts";
import { verifyAuthRoute } from "./verify-auth/index.ts";

const authRoutes = async (fastify: FastifyInstance): Promise<void> => {
  await signinRoute(fastify);
  await signupRoute(fastify);
  await verifyAuthRoute(fastify);
  await verifyRoute(fastify);
};

export { authRoutes };
