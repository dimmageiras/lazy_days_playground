import Fastify from "fastify";
import type { Mock, OnTestFinishedHandler } from "vitest";

import type { AppInstance } from "@server/types/instance.type";

import { TypeHelper } from "@shared/helpers/type.helper";

const { castAsType } = TypeHelper;

interface CreateTestAppOptions {
  mocksToReset?: Array<Mock>;
  resetFn?: () => Promise<void> | void;
}

const createTestApp = (
  onTestFinished: (fn: OnTestFinishedHandler) => void,
  options?: CreateTestAppOptions,
): AppInstance => {
  const app = Fastify({ logger: false });

  const { mocksToReset, resetFn } = options ?? {};

  onTestFinished(async () => {
    for (const mock of mocksToReset ?? []) {
      mock.mockReset();
    }

    await resetFn?.();

    await app.close();
  });

  return castAsType<AppInstance>(app);
};

const FastifyHelper = Object.freeze({
  createTestApp,
} as const);

export { FastifyHelper };
