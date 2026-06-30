import type { Mock } from "@vitest/spy";
import Fastify from "fastify";
import type { OnTestFinishedHandler } from "vitest";
import { vi } from "vitest";

import type { AppInstance } from "@server/types/instance.type";

import { LOG_LEVEL } from "@shared/constants/log-level.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { SHARED_TEST_DATA } from "../constants/shared-test-data.constant";

const { castAsType } = TypeHelper;

const { VALID_DEV_APP_ENV } = SHARED_TEST_DATA;

interface CreateMockInstanceOptions {
  appEnv?: Partial<AppEnv>;
  listen?: Mock;
}

interface CreateTestAppOptions {
  mocksToReset?: Array<Mock>;
  resetFn?: () => Promise<void> | void;
}

const createMockInstance = (
  options?: CreateMockInstanceOptions,
): AppInstance => {
  const { appEnv, listen } = options ?? {};

  return castAsType<AppInstance>({
    appEnv: { ...VALID_DEV_APP_ENV, ...appEnv },
    listen: listen ?? vi.fn(),
    log: Object.fromEntries(
      LOG_LEVEL.toArray().map((level) => [level, vi.fn()]),
    ),
  });
};

const createTestApp = (
  onTestFinished: (fn: OnTestFinishedHandler) => void,
  options?: CreateTestAppOptions,
): AppInstance => {
  const app = Fastify({ logger: false });

  app.decorate("appEnv", VALID_DEV_APP_ENV);

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
  createMockInstance,
  createTestApp,
} as const);

export { FastifyHelper };
