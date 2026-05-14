import type closeWithGrace from "close-with-grace";

type CloseWithGraceReturn = ReturnType<typeof closeWithGrace>;

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
  CloseWithGraceReturn,
  ShutdownRequestConfig,
  ShutdownRouteConfig,
  ShutdownRouteOptions,
};
