import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { APIAppInstance } from "@server/types/instance.type";

import { GracefulShutdownHelper } from "./helpers/graceful-shutdown.helper";
import { gracefulShutdownRoutes } from "./routes/graceful-shutdown.route";

const { API_INTERNAL } = BASE_URLS;
const { buildShutdownHandler, buildShutdownOptions } = GracefulShutdownHelper;

const setupGracefulShutdown = async (
  instance: APIAppInstance,
  hot: ImportMeta["hot"],
): Promise<void> => {
  await instance.register(gracefulShutdownRoutes, { prefix: API_INTERNAL });

  const handle = closeWithGrace(
    buildShutdownOptions(instance),
    buildShutdownHandler(instance),
  );

  if (hot) {
    hot.dispose(async () => {
      handle.uninstall();

      await instance.close();
    });

    hot.accept();
  }
};

const GracefulShutdownModule = Object.freeze({
  setupGracefulShutdown,
} as const);

export { GracefulShutdownModule };
