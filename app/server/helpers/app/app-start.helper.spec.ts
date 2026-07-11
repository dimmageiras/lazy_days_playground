import type { MockInstance } from "vitest";
import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ENV_VALIDATION } from "@server/constants/env-validation.constant";
import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { TypeHelper } from "@shared/helpers/type.helper";

import { AppStartHelper } from "./app-start.helper";
import type * as EnvVarHelperModule from "./env-var.helper";

const { mockBuild, mockValidateEnv } = vi.hoisted(() => ({
  mockBuild: vi.fn(),
  mockValidateEnv: vi.fn(),
}));

vi.mock("./app-build.helper", () => ({
  AppBuildHelper: { build: mockBuild },
}));

vi.mock("./env-var.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof EnvVarHelperModule>();

  return {
    ...actual,
    EnvVarHelper: {
      ...actual.EnvVarHelper,
      validateEnv: mockValidateEnv,
    },
  };
});

const {
  createMockInstance,
  sharedTestData: { UNDEFINED_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("app-start.helper");

const { ERROR_NAME } = ENV_VALIDATION;

const { normalizeError } = ErrorHelper;
const { castAsType } = TypeHelper;

const { start } = AppStartHelper;

const {
  instanceOf,
  makeEnv,
  makeInstance,
  makeModules,
  scenarioOf,
  ...TEST_DATA
} = {
  BUILD_ERROR: new Error("Failed to build"),
  CLAIM_ERROR: new Error("Port still in use"),
  CLOSE_ERROR: new Error("Failed to close"),
  CLOSE_FAILURE_MESSAGE:
    "💥 Failed to close the server after a startup failure",
  ENV_UNEXPECTED_ERROR: new Error("Unexpected boom"),
  EXIT_ERROR: new Error("process.exit"),
  HOT: castAsType<ImportMeta["hot"]>({}),
  INSTANCE_KEY: "__appStartInstance",
  REDACT_PATHS: ["password", "token"],
  SCENARIO_KEY: "__appStartScenario",
  START_FAILURE_MESSAGE: "💥 Failed to start the server",
  UNEXPECTED_FAILURE_MESSAGE:
    "💥 Unexpected error while validating the environment",
  VALIDATION_FAILURE_MESSAGE: "💥 Failed to validate the environment",
  get ENV_VALIDATION_ERROR() {
    const error = new Error("Invalid environment");

    error.name = ERROR_NAME;

    return error;
  },
  get instanceOf() {
    return (carrier: ImportMetaEnv): AppInstance =>
      castAsType<AppInstance>(Reflect.get(carrier, this.INSTANCE_KEY));
  },
  get makeEnv() {
    return (scenario: {
      buildError?: Error;
      closeError?: Error;
      envError?: Error;
    }): ImportMetaEnv => {
      const env = castAsType<ImportMetaEnv>({});

      Reflect.set(env, this.SCENARIO_KEY, scenario);

      return env;
    };
  },
  get makeInstance() {
    return (scenario: { closeError?: Error }): AppInstance => {
      const instance = createMockInstance();

      Reflect.set(
        instance,
        "close",
        vi.fn(() =>
          scenario.closeError
            ? Promise.reject(scenario.closeError)
            : Promise.resolve(),
        ),
      );

      Reflect.set(
        instance.log,
        "flush",
        vi.fn((callback: () => void) => {
          callback();
        }),
      );

      return instance;
    };
  },
  get makeModules() {
    return () => {
      const fallbackFatal = vi.fn();
      const buildFallbackLogger = vi.fn(() => ({
        fatal: fallbackFatal,
      }));
      const buildLogger = vi.fn();
      const claimPort = vi.fn();
      const setupDb = vi.fn();
      const setupDocs = vi.fn();
      const setupShutdown = vi.fn();
      const setupValidation = vi.fn();

      return {
        buildLogger,
        claimPort,
        fallbackFatal,
        modules: castAsType<Parameters<typeof start>[2]>({
          db: { setupDb },
          logger: { buildFallbackLogger, buildLogger },
          openapi: { setupDocs, setupValidation },
          shutdown: {
            redactPaths: this.REDACT_PATHS,
            setupShutdown,
          },
          startup: { claimPort },
        }),
        setupDb,
        setupDocs,
        setupShutdown,
        setupValidation,
      };
    };
  },
  get scenarioOf() {
    return (
      carrier: ImportMetaEnv,
    ): {
      buildError?: Error;
      closeError?: Error;
      envError?: Error;
    } =>
      castAsType<{
        buildError?: Error;
        closeError?: Error;
        envError?: Error;
      }>(Reflect.get(carrier, this.SCENARIO_KEY));
  },
} as const;

describe("AppStartHelper", () => {
  describe("start", (it) => {
    const { afterAll, beforeAll } = it;

    let processExitSpy: MockInstance<typeof process.exit>;

    beforeAll(() => {
      processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw TEST_DATA.EXIT_ERROR;
      });
      mockValidateEnv.mockImplementation((env: ImportMetaEnv) => {
        const { envError } = scenarioOf(env);

        if (envError) {
          throw envError;
        }

        return env;
      });
      mockBuild.mockImplementation((env: ImportMetaEnv) => {
        const scenario = scenarioOf(env);

        if (scenario.buildError) {
          return Promise.reject(scenario.buildError);
        }

        const instance = makeInstance(scenario);

        Reflect.set(env, TEST_DATA.INSTANCE_KEY, instance);

        return Promise.resolve(instance);
      });
    });

    afterAll(() => {
      mockBuild.mockReset();
      mockValidateEnv.mockReset();
      processExitSpy.mockRestore();
    });

    it("should validate the env, build the app, claim the port, and not exit when startup succeeds", async ({
      expect,
    }) => {
      const env = makeEnv({});
      const {
        buildLogger,
        claimPort,
        fallbackFatal,
        modules,
        setupDb,
        setupDocs,
        setupShutdown,
        setupValidation,
      } = makeModules();

      claimPort.mockResolvedValue(UNDEFINED_VALUE);

      await expect(start(env, TEST_DATA.HOT, modules)).resolves.toBeUndefined();

      const instance = instanceOf(env);

      expect(
        mockValidateEnv.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([[env]]);
      expect(
        mockBuild.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([
        [
          env,
          TEST_DATA.HOT,
          {
            db: { setupDb },
            logger: { buildLogger },
            openapi: { setupDocs, setupValidation },
            shutdown: {
              redactPaths: TEST_DATA.REDACT_PATHS,
              setupShutdown,
            },
          },
        ],
      ]);
      expect(claimPort).toHaveBeenNthCalledWith(1, instance);
      expect(fallbackFatal).not.toHaveBeenCalled();
      expect(instance.log.fatal).not.toHaveBeenCalled();
    });

    it("should log the validation-error message and exit when the environment is invalid", async ({
      expect,
    }) => {
      const env = makeEnv({
        envError: TEST_DATA.ENV_VALIDATION_ERROR,
      });
      const { fallbackFatal, modules } = makeModules();

      await expect(start(env, TEST_DATA.HOT, modules)).rejects.toBe(
        TEST_DATA.EXIT_ERROR,
      );

      expect(fallbackFatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.ENV_VALIDATION_ERROR),
        TEST_DATA.VALIDATION_FAILURE_MESSAGE,
      );
      expect(
        mockBuild.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([]);
    });

    it("should log the unexpected-error message and exit when validation throws unexpectedly", async ({
      expect,
    }) => {
      const env = makeEnv({
        envError: TEST_DATA.ENV_UNEXPECTED_ERROR,
      });
      const { fallbackFatal, modules } = makeModules();

      await expect(start(env, TEST_DATA.HOT, modules)).rejects.toBe(
        TEST_DATA.EXIT_ERROR,
      );

      expect(fallbackFatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.ENV_UNEXPECTED_ERROR),
        TEST_DATA.UNEXPECTED_FAILURE_MESSAGE,
      );
      expect(
        mockBuild.mock.calls.filter(([calledWith]) => calledWith === env),
      ).toStrictEqual([]);
    });

    it("should log via the fallback logger and exit when building the app fails", async ({
      expect,
    }) => {
      const env = makeEnv({
        buildError: TEST_DATA.BUILD_ERROR,
      });
      const { claimPort, fallbackFatal, modules } = makeModules();

      await expect(start(env, TEST_DATA.HOT, modules)).rejects.toBe(
        TEST_DATA.EXIT_ERROR,
      );

      expect(fallbackFatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.BUILD_ERROR),
        TEST_DATA.START_FAILURE_MESSAGE,
      );
      expect(claimPort).not.toHaveBeenCalled();
    });

    it("should log on the instance, close it, and exit when claiming the port fails", async ({
      expect,
    }) => {
      const env = makeEnv({});
      const { claimPort, fallbackFatal, modules } = makeModules();

      claimPort.mockRejectedValue(TEST_DATA.CLAIM_ERROR);

      await expect(start(env, TEST_DATA.HOT, modules)).rejects.toBe(
        TEST_DATA.EXIT_ERROR,
      );

      const instance = instanceOf(env);

      expect(instance.log.fatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.CLAIM_ERROR),
        TEST_DATA.START_FAILURE_MESSAGE,
      );
      expect(instance.close).toHaveBeenCalledTimes(1);
      expect(fallbackFatal).not.toHaveBeenCalled();
    });

    it("should also log the close failure when closing the instance fails after a startup failure", async ({
      expect,
    }) => {
      const env = makeEnv({
        closeError: TEST_DATA.CLOSE_ERROR,
      });
      const { claimPort, modules } = makeModules();

      claimPort.mockRejectedValue(TEST_DATA.CLAIM_ERROR);

      await expect(start(env, TEST_DATA.HOT, modules)).rejects.toBe(
        TEST_DATA.EXIT_ERROR,
      );

      const instance = instanceOf(env);

      expect(instance.log.fatal).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.CLAIM_ERROR),
        TEST_DATA.START_FAILURE_MESSAGE,
      );
      expect(instance.log.fatal).toHaveBeenNthCalledWith(
        2,
        normalizeError(TEST_DATA.CLOSE_ERROR),
        TEST_DATA.CLOSE_FAILURE_MESSAGE,
      );
      expect(instance.close).toHaveBeenCalledTimes(1);
    });
  });
});
