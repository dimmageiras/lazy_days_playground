import type closeWithGrace from "close-with-grace";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

interface BootstrapConfig {
  app: FastifyInstance;
  port: number;
  shutdownPath: string;
  shutdownToken: string;
}

interface BootstrapServerReturn {
  shutdownRouteWithListeners: readonly [
    FastifyPluginAsync<ShutdownRouteOptions>,
    ShutdownRouteOptions,
  ];
  claimPort: () => Promise<void>;
}

type CloseWithGraceReturn = ReturnType<typeof closeWithGrace>;

interface ShutdownRouteConfig {
  path: string;
  token: string;
}

interface ShutdownRouteOptions {
  closeListeners: CloseWithGraceReturn;
}

export type {
  BootstrapConfig,
  BootstrapServerReturn,
  CloseWithGraceReturn,
  ShutdownRouteConfig,
  ShutdownRouteOptions,
};
