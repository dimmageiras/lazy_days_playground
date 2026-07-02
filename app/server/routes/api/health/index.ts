import type { AppInstance } from "@server/types/instance.type.js";

import { dbRoute } from "./db";
import { serverRoute } from "./server";

const apiHealthRoutes = async (fastify: AppInstance): Promise<void> => {
  await dbRoute(fastify);
  await serverRoute(fastify);
};

export { apiHealthRoutes };
