import type closeWithGrace from "close-with-grace";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

interface BootstrapConfigOptions {
  port: number;
  token: string;
}

interface BootstrapConfig {
  app: FastifyInstance;
  options: BootstrapConfigOptions;
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
  token: string;
}

interface ShutdownRequestConfig extends ShutdownRouteConfig {
  port: number;
}

interface ShutdownRouteOptions {
  closeListeners: CloseWithGraceReturn;
}

export type {
  BootstrapConfig,
  BootstrapServerReturn,
  CloseWithGraceReturn,
  ShutdownRequestConfig,
  ShutdownRouteConfig,
  ShutdownRouteOptions,
};
