import type closeWithGrace from "close-with-grace";

type ShutdownContext = Parameters<closeWithGrace.CloseWithGraceAsyncCallback>[0];
type ShutdownHandler = closeWithGrace.CloseWithGraceAsyncCallback;
type ShutdownOptions = closeWithGrace.Options;
type ShutdownHandle = Readonly<ReturnType<typeof closeWithGrace>>;

export type {
  ShutdownContext,
  ShutdownHandle,
  ShutdownHandler,
  ShutdownOptions,
};
