import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];

type ShutdownHandler = CloseWithGraceAsyncCallback;

type ShutdownOptions = Options;

export type { ShutdownContext, ShutdownHandler, ShutdownOptions };
