import type closeWithGrace from "close-with-grace";
import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyTypeProviderDefault,
  RawServerDefault,
} from "fastify";
import type { IncomingMessage, ServerResponse } from "http";

type CloseWithGraceReturn = ReturnType<typeof closeWithGrace>;

interface ShutdownRequestConfig {
  readonly log: FastifyInstance<
    RawServerDefault,
    IncomingMessage,
    ServerResponse<IncomingMessage>,
    FastifyBaseLogger,
    FastifyTypeProviderDefault
  >["log"];
  readonly port: number;
  readonly token: string;
}

interface ShutdownRouteOptions {
  readonly closeListeners: CloseWithGraceReturn;
  readonly token: string;
}

export type {
  CloseWithGraceReturn,
  ShutdownRequestConfig,
  ShutdownRouteOptions,
};
