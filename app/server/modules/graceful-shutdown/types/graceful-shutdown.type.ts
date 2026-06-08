import type closeWithGrace from "close-with-grace";
import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];
type ShutdownHandler = CloseWithGraceAsyncCallback;
type ShutdownOptions = Options;

interface GracefulShutdownRouteOptions {
  handle: Readonly<ReturnType<typeof closeWithGrace>>;
}

export type {
  GracefulShutdownRouteOptions,
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
};
