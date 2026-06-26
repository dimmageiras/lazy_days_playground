import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppHelper } from "./app.helper";

const {
  mockApiHealthRoutes,
  mockBuildAppEnv,
  mockBuildLogger,
  mockFastify,
  mockSetupShutdown,
} = vi.hoisted(() => ({
  mockApiHealthRoutes: vi.fn(),
  mockBuildAppEnv: vi.fn(),
  mockBuildLogger: vi.fn(),
  mockFastify: vi.fn(),
  mockSetupShutdown: vi.fn(),
}));

vi.mock("fastify", () => ({ default: mockFastify }));

vi.mock("@server/routes/api/health", () => ({
  apiHealthRoutes: mockApiHealthRoutes,
}));

vi.mock("./app-env.helper", () => ({
  AppEnvHelper: { buildAppEnv: mockBuildAppEnv },
}));

const {
  createMockInstance,
  sharedTestData: { UNDEFINED_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("app.helper");

const { API_HEALTH } = BASE_URLS;
const { SECONDS_TEN } = TIMING_IN_MS;

const { normalizeError } = ErrorHelper;
const { castAsType } = TypeHelper;

const { build } = AppHelper;

const { instanceOf, makeEnv, makeInstance, scenarioOf, ...TEST_DATA } = {
  CLOSE_ERROR: new Error("Failed to close"),
  CLOSE_FAILURE_MESSAGE: "💥 Failed to close the app after a build failure",
  ERROR: new Error("Failed to build"),
  FAILURE_MESSAGE: "💥 Failed to build the app",
  HOT: castAsType<ImportMeta["hot"]>({}),
  INSTANCE_KEY: "__appHelperInstance",
  SCENARIO_KEY: "__appHelperScenario",
  REDACT_PATHS: ["password", "token"],
  get MODULES() {
    return {
      logger: { buildLogger: mockBuildLogger },
      shutdown: {
        redactPaths: this.REDACT_PATHS,
        setupShutdown: mockSetupShutdown,
      },
    };
  },
  get instanceOf() {
    return (carrier: ViteAppEnv): AppInstance =>
      castAsType<AppInstance>(Reflect.get(carrier, this.INSTANCE_KEY));
  },
  get makeEnv() {
    return (scenario: {
      closeError?: Error;
      registerError?: Error;
    }): ViteAppEnv => {
      const env = castAsType<ViteAppEnv>({});

      Reflect.set(env, this.SCENARIO_KEY, scenario);

      return env;
    };
  },
  get makeInstance() {
    return (scenario: {
      closeError?: Error;
      registerError?: Error;
    }): AppInstance => {
      const instance = createMockInstance();

      Reflect.set(instance, "decorate", vi.fn());

      Reflect.set(
        instance,
        "register",
        vi.fn(() =>
          scenario.registerError
            ? Promise.reject(scenario.registerError)
            : Promise.resolve(),
        ),
      );

      Reflect.set(
        instance,
        "close",
        vi.fn(() =>
          scenario.closeError
            ? Promise.reject(scenario.closeError)
            : Promise.resolve(),
        ),
      );

      return instance;
    };
  },
  get scenarioOf() {
    return (
      carrier: ViteAppEnv,
    ): { closeError?: Error; registerError?: Error } =>
      castAsType<{ closeError?: Error; registerError?: Error }>(
        Reflect.get(carrier, this.SCENARIO_KEY),
      );
  },
} as const;

describe("AppHelper", () => {
  describe("build", (it) => {
    const { afterAll, beforeAll } = it;

    beforeAll(() => {
      mockBuildAppEnv.mockImplementation((env: ViteAppEnv) => env);
      mockBuildLogger.mockImplementation((appEnv: ViteAppEnv) => appEnv);
      mockFastify.mockImplementation(
        (options: { loggerInstance: ViteAppEnv }) => {
          const instance = makeInstance(scenarioOf(options.loggerInstance));

          Reflect.set(options.loggerInstance, TEST_DATA.INSTANCE_KEY, instance);

          return instance;
        },
      );
      mockSetupShutdown.mockResolvedValue(UNDEFINED_VALUE);
    });

    afterAll(() => {
      mockBuildAppEnv.mockReset();
      mockBuildLogger.mockReset();
      mockFastify.mockReset();
      mockSetupShutdown.mockReset();
    });

    it("should build the app, wire the collaborators, and return the configured instance", async ({
      expect,
    }) => {
      const env = makeEnv({});

      const instance = await build(env, TEST_DATA.HOT, TEST_DATA.MODULES);

      expect(instance).toBe(instanceOf(env));
      expect(
        mockBuildAppEnv.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([[env]]);
      expect(
        mockBuildLogger.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([[env, [...TEST_DATA.REDACT_PATHS]]]);
      const fastifyCallIndex = mockFastify.mock.results.findIndex(
        ({ value }) => value === instance,
      );

      expect(mockFastify.mock.calls.at(fastifyCallIndex)).toStrictEqual([
        { loggerInstance: env, requestTimeout: SECONDS_TEN },
      ]);
      expect(instance.decorate).toHaveBeenNthCalledWith(1, "appEnv", env);
      expect(instance.register).toHaveBeenNthCalledWith(
        1,
        mockApiHealthRoutes,
        {
          prefix: API_HEALTH,
        },
      );
      expect(
        mockSetupShutdown.mock.calls.filter(
          ([calledWith]) => calledWith === instance,
        ),
      ).toStrictEqual([[instance, TEST_DATA.HOT]]);
      expect(instance.close).not.toHaveBeenCalled();
      expect(instance.log.error).not.toHaveBeenCalled();
    });

    it("should log the failure, close the instance, and rethrow when a build step fails", async ({
      expect,
    }) => {
      const env = makeEnv({ registerError: TEST_DATA.ERROR });

      await expect(build(env, TEST_DATA.HOT, TEST_DATA.MODULES)).rejects.toBe(
        TEST_DATA.ERROR,
      );

      const instance = instanceOf(env);

      expect(instance.log.error).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.ERROR),
        TEST_DATA.FAILURE_MESSAGE,
      );
      expect(instance.close).toHaveBeenCalledTimes(1);
    });

    it("should also log the close failure when closing after a build failure fails", async ({
      expect,
    }) => {
      const env = makeEnv({
        closeError: TEST_DATA.CLOSE_ERROR,
        registerError: TEST_DATA.ERROR,
      });

      await expect(build(env, TEST_DATA.HOT, TEST_DATA.MODULES)).rejects.toBe(
        TEST_DATA.ERROR,
      );

      const instance = instanceOf(env);

      expect(instance.log.error).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.ERROR),
        TEST_DATA.FAILURE_MESSAGE,
      );
      expect(instance.log.error).toHaveBeenNthCalledWith(
        2,
        normalizeError(TEST_DATA.CLOSE_ERROR),
        TEST_DATA.CLOSE_FAILURE_MESSAGE,
      );
      expect(instance.close).toHaveBeenCalledTimes(1);
    });
  });
});
