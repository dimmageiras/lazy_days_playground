import type closeWithGrace from "close-with-grace";
import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];
type ShutdownHandler = CloseWithGraceAsyncCallback;
type ShutdownOptions = Options;

interface ShutdownRouteOptions {
  handle: Readonly<ReturnType<typeof closeWithGrace>>;
}

export type {
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
  ShutdownRouteOptions,
};
