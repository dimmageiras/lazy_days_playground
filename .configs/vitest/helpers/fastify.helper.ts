import type { Mock, Procedure } from "@vitest/spy";
import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import type { OnTestFinishedHandler } from "vitest";

interface CreateTestAppOptions {
  mocksToReset?: Array<Mock<Procedure>>;
  resetFn?: () => Promise<void> | void;
}

const createTestApp = (
  onTestFinished: (fn: OnTestFinishedHandler) => void,
  options?: CreateTestAppOptions,
): FastifyInstance => {
  const app = Fastify({ logger: false });

  const { mocksToReset, resetFn } = options ?? {};

  onTestFinished(async () => {
    for (const mock of mocksToReset ?? []) {
      mock.mockReset();
    }

    await resetFn?.();

    await app.close();
  });

  return app;
};

const FastifyHelper = Object.freeze({
  createTestApp,
} as const);

export { FastifyHelper };
