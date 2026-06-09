import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { APIAppInstance } from "@server/types/instance.type";

import { GracefulShutdownHelper } from "./helpers/graceful-shutdown.helper";
import { gracefulShutdownRoutes } from "./routes/graceful-shutdown.route";

const { API_INTERNAL } = BASE_URLS;

const { buildShutdownHandler, buildShutdownOptions } = GracefulShutdownHelper;

const setupGracefulShutdown = async (
  instance: APIAppInstance,
): Promise<void> => {
  const handle = closeWithGrace(
    buildShutdownOptions(instance.log),
    buildShutdownHandler(instance),
  );

  instance.addHook("onClose", async () => {
    handle.uninstall();
  });

  await instance.register(gracefulShutdownRoutes, {
    handle,
    prefix: API_INTERNAL,
  });
};

const GracefulShutdownModule = Object.freeze({
  setupGracefulShutdown,
} as const);

export { GracefulShutdownModule };
