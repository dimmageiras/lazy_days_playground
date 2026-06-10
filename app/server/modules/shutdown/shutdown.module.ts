import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { AppInstance } from "@server/types/instance.type";

import { REDACT_PATHS } from "./constants/redact.constant";
import { ClaimPortHelper } from "./helpers/claim-port.helper";
import { HotReloadHelper } from "./helpers/hot-reload.helper";
import { ShutdownHelper } from "./helpers/shutdown.helper";
import { shutdownRoutes } from "./routes/shutdown.route";

const { API_INTERNAL } = BASE_URLS;

const { claimPort } = ClaimPortHelper;
const { acceptHotReload } = HotReloadHelper;
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

  await acceptHotReload(instance, hot);

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
