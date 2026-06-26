import type closeWithGrace from "close-with-grace";
import type { CloseWithGraceAsyncCallback, Options } from "close-with-grace";

import type { AppInstance } from "@server/types/instance.type";

type RedactPaths = ReadonlyArray<string>;

type SetupShutdownFunction = (
  instance: Readonly<AppInstance>,
  hot: ImportMeta["hot"],
) => Promise<void>;

type ShutdownContext = Parameters<CloseWithGraceAsyncCallback>[0];
type ShutdownHandler = CloseWithGraceAsyncCallback;
type ShutdownOptions = Options;

interface ShutdownRouteOptions {
  handle: Readonly<ReturnType<typeof closeWithGrace>>;
}

export type {
  RedactPaths,
  SetupShutdownFunction,
  ShutdownContext,
  ShutdownHandler,
  ShutdownOptions,
  ShutdownRouteOptions,
};
