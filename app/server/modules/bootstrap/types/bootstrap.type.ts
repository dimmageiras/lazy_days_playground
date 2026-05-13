import type closeWithGrace from "close-with-grace";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

interface BootstrapConfig {
  app: FastifyInstance;
  port: number;
  token: string;
}

interface BootstrapServerReturn {
  claimPort: () => Promise<void>;
  shutdownRoute: FastifyPluginAsync<ShutdownRouteOptions>;
  shutdownRouteOptions: ShutdownRouteOptions;
}

type CloseWithGraceReturn = ReturnType<typeof closeWithGrace>;

type PidLookupResult =
  | { found: true; pid: number }
  | { found: false; reason: "unsupported-platform" | "no-pid" };

type KillPortOwnerResult =
  | { ok: true }
  | {
      ok: false;
      reason: "unsupported-platform" | "no-pid" | "kill-threw";
    };

interface ShutdownRouteConfig {
  token: string;
}

interface ShutdownRequestConfig extends ShutdownRouteConfig {
  port: number;
}

interface ShutdownRouteOptions {
  readonly closeListeners: CloseWithGraceReturn;
}

export type {
  BootstrapConfig,
  BootstrapServerReturn,
  CloseWithGraceReturn,
  KillPortOwnerResult,
  PidLookupResult,
  ShutdownRequestConfig,
  ShutdownRouteConfig,
  ShutdownRouteOptions,
};
