import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { AppInstance } from "@server/types/instance.type";

import { ShutdownHelper } from "./helpers/shutdown.helper";
import { shutdownRoutes } from "./routes/shutdown.route";

const { API_INTERNAL } = BASE_URLS;

const { buildShutdownHandler, buildShutdownOptions } = ShutdownHelper;

const setupShutdown = async (instance: AppInstance): Promise<void> => {
  const handle = closeWithGrace(
    buildShutdownOptions(instance.log),
    buildShutdownHandler(instance),
  );

  instance.addHook("onClose", async () => {
    handle.uninstall();
  });

  await instance.register(shutdownRoutes, {
    handle,
    prefix: API_INTERNAL,
  });
};

const ShutdownModule = Object.freeze({
  setupShutdown,
} as const);

export { ShutdownModule };
