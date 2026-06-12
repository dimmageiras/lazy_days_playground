import closeWithGrace from "close-with-grace";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { AppInstance } from "@server/types/instance.type";

import { REDACT_PATHS } from "./constants/redact.constant";
import { ClaimPortHelper } from "./helpers/claim-port.helper";
import { CloseWithGraceHelper } from "./helpers/close-with-grace.helper";
import { HotReloadHelper } from "./helpers/hot-reload.helper";
import { routes } from "./routes";

const { API_INTERNAL } = BASE_URLS;

const { claimPort } = ClaimPortHelper;
const { buildShutdownHandler, buildShutdownOptions } = CloseWithGraceHelper;
const { acceptHotReload } = HotReloadHelper;

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

  await instance.register(routes, {
    handle,
    prefix: API_INTERNAL,
  });

  await claimPort(instance);
};

const ShutdownModule = Object.freeze({
  redactPaths: REDACT_PATHS,
  setupShutdown,
} as const);

export { ShutdownModule };
