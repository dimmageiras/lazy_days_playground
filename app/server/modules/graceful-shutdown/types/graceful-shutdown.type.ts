import type closeWithGrace from "close-with-grace";
import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];
type ShutdownHandler = CloseWithGraceAsyncCallback;
type ShutdownOptions = Options;
type ShutdownHandle = Readonly<ReturnType<typeof closeWithGrace>>;

export type {
  ShutdownContext,
  ShutdownHandle,
  ShutdownHandler,
  ShutdownOptions,
};
