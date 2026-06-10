import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { REDACT_PATHS } from "./constants/redact.constant";
import { ClaimPortHelper } from "./helpers/claim-port.helper";
import { ShutdownHelper } from "./helpers/shutdown.helper";
import { shutdownRoutes } from "./routes/shutdown.route";

const { API_INTERNAL } = BASE_URLS;

const { claimPort } = ClaimPortHelper;
const { normalizeError } = ErrorHelper;
const { buildShutdownHandler, buildShutdownOptions } = ShutdownHelper;

const setupShutdown = async (
  instance: AppInstance,
  hot: ImportMeta["hot"],
): Promise<void> => {
  const handle = closeWithGrace(
    buildShutdownOptions(instance.log),
    buildShutdownHandler(instance),
  );

  instance.addHook("onClose", async () => {
    handle.uninstall();
  });

  if (hot) {
    const hotData: { instance?: AppInstance } = hot.data;

    if (hotData.instance) {
      try {
        await hotData.instance.close();
      } catch (rawError) {
        instance.log.error(
          normalizeError(rawError),
          "💥 Failed to close the previous instance during hot reload",
        );
      }
    }

    hotData.instance = instance;

    hot.accept();
  }

  await instance.register(shutdownRoutes, {
    handle,
    prefix: API_INTERNAL,
  });
};

const buildShutdown = async (
  instance: AppInstance,
  hot: ImportMeta["hot"],
): Promise<void> => {
  await setupShutdown(instance, hot);

  await claimPort(instance);
};

const ShutdownModule = Object.freeze({
  buildShutdown,
  redactPaths: REDACT_PATHS,
} as const);

export { ShutdownModule };
