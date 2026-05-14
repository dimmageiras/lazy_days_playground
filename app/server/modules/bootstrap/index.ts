import { bootstrapServer } from "./bootstrap.module";
import { PROTOCOLS } from "./constants";
import { BootstrapLifecycleHelper } from "./helpers/bootstrap-lifecycle.helper";
import { registerCurrent, retirePrior } from "./listeners";
import type { LifecyclePriorInstance } from "./types";

const { SHUTDOWN_TOKEN_HEADER: shutdownTokenHeader } = PROTOCOLS;

const { createBootstrapLifecycleBus } = BootstrapLifecycleHelper;

const BootstrapModule = Object.freeze({
  bootstrapServer,
  createBootstrapLifecycleBus,
  registerCurrent,
  retirePrior,
  shutdownTokenHeader,
} as const);

export type { LifecyclePriorInstance };
export { BootstrapModule };
