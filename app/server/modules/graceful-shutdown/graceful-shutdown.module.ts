import closeWithGrace from "close-with-grace";

import type { AppInstance } from "@server/types/instance.type";

import { GracefulShutdownHelper } from "./helpers/graceful-shutdown.helper";
import type { ShutdownHandle } from "./types/graceful-shutdown.type";

const { buildShutdownHandler, buildShutdownOptions } = GracefulShutdownHelper;

const registerGracefulShutdown = (instance: AppInstance): ShutdownHandle => {
  const handle = closeWithGrace(
    buildShutdownOptions(instance),
    buildShutdownHandler(instance),
  );

  return Object.freeze(handle);
};

const GracefulShutdownModule = Object.freeze({
  registerGracefulShutdown,
} as const);

export { GracefulShutdownModule };
