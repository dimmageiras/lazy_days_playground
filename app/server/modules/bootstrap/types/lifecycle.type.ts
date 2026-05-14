import type { Signals } from "close-with-grace";
import type { FastifyInstance } from "fastify";

import type { CloseWithGraceReturn } from "./shutdown.type";

interface LifecyclePriorInstance {
  app: FastifyInstance;
  handle: CloseWithGraceReturn;
}

interface LifecycleRegisterPayload {
  readonly app: FastifyInstance;
  readonly handle: CloseWithGraceReturn;
}

interface LifecycleEventMap {
  register: LifecycleRegisterPayload;
  retire: LifecycleRetirePayload | undefined;
}

interface LifecycleRetirePayload {
  readonly err?: Error;
  readonly manual?: boolean;
  readonly signal?: Signals;
}

export type {
  LifecycleEventMap,
  LifecyclePriorInstance,
  LifecycleRegisterPayload,
  LifecycleRetirePayload,
};
