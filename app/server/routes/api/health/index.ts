import type { AppInstance } from "@server/types/instance.type.js";

import { serverRoute } from "./server";

const apiHealthRoutes = async (fastify: AppInstance): Promise<void> => {
  await serverRoute(fastify);
};

export { apiHealthRoutes };
