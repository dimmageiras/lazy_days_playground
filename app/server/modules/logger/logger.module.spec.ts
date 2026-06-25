import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypeHelper } from "@shared/helpers/type.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { LoggerModule } from "./logger.module";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    COMMON_LOG_LEVEL,
    COMMON_STRING_ARRAY,
    VALID_DEV_APP_ENV,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("logger.module");

const { castAsType } = TypeHelper;

const { buildFallbackLogger, buildLogger } = LoggerModule;

const TEST_DATA = {
  PROD_APP_ENV: castAsType<AppEnv>({
    ...VALID_DEV_APP_ENV,
    isDevelopment: BOOLEAN_FALSE,
    logLevel: "warn",
  }),
  REDACT_PATHS: COMMON_STRING_ARRAY,
} as const;

describe("LoggerModule", () => {
  describe("buildFallbackLogger", (it) => {
    it("should create a logger at the info level", ({ expect }) => {
      expect(buildFallbackLogger().level).toBe(COMMON_LOG_LEVEL);
    });

    it("should expose the logger surface used at call sites", ({ expect }) => {
      const logger = buildFallbackLogger();

      expect(typeof logger.info).toBe("function");
      expect(typeof logger.flush).toBe("function");
    });
  });

  describe("buildLogger", (it) => {
    it("should create a logger at the env's configured level", ({ expect }) => {
      expect(buildLogger(TEST_DATA.PROD_APP_ENV).level).toBe(
        TEST_DATA.PROD_APP_ENV.logLevel,
      );
    });

    it("should accept explicit redact paths", ({ expect }) => {
      expect(
        buildLogger(TEST_DATA.PROD_APP_ENV, TEST_DATA.REDACT_PATHS).level,
      ).toBe(TEST_DATA.PROD_APP_ENV.logLevel);
    });
  });
});
