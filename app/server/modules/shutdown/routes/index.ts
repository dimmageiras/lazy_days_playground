import type { AppInstance } from "@server/types/instance.type";

import type { ShutdownRouteOptions } from "../types/shutdown.type";
import { shutdownRoute } from "./shutdown";

const routes = async (
  fastify: AppInstance,
  { handle }: ShutdownRouteOptions,
): Promise<void> => {
  await shutdownRoute(fastify, { handle });
};

export { routes };
