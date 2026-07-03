import type { AppInstance } from "@server/types/instance.type";

import { dbRoute } from "./db";
import { serverRoute } from "./server";

const apiHealthRoutes = async (fastify: AppInstance): Promise<void> => {
  await fastify.register(dbRoute);
  await fastify.register(serverRoute);
};

export { apiHealthRoutes };
