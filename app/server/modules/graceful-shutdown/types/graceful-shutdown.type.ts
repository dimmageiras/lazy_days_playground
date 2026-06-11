import type closeWithGrace from "close-with-grace";
import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

interface GracefulShutdownRouteOptions {
  handle: Readonly<ReturnType<typeof closeWithGrace>>;
}

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];

type ShutdownHandler = CloseWithGraceAsyncCallback;

type ShutdownOptions = Options;

export type {
  GracefulShutdownRouteOptions,
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
};
