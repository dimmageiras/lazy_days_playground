import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypeHelper } from "@shared/helpers/type.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/logger.constant";
import { LoggerHelper } from "./logger.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_LOG_LEVEL,
    COMMON_STRING,
    COMMON_STRING_ARRAY,
    EMPTY_ARRAY,
    VALID_DEV_APP_ENV,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("logger.helper");

const { castAsType } = TypeHelper;

const { buildFallbackLoggerOptions, buildLoggerOptions } = LoggerHelper;

const TEST_DATA = {
  EMPTY_REDACT_PATHS: EMPTY_ARRAY,
  FALLBACK_OPTIONS: { level: COMMON_LOG_LEVEL },
  OPTIONS_CASES: [
    {
      expected: { base: { service: COMMON_STRING }, level: COMMON_LOG_LEVEL },
      isDevelopment: BOOLEAN_FALSE,
      name: "should build minimal options for production without redact paths",
      withRedaction: BOOLEAN_FALSE,
    },
    {
      expected: {
        base: { service: COMMON_STRING },
        level: COMMON_LOG_LEVEL,
        transport: PRETTY_TRANSPORT,
      },
      isDevelopment: BOOLEAN_TRUE,
      name: "should add the pretty transport in development",
      withRedaction: BOOLEAN_FALSE,
    },
    {
      expected: {
        base: { service: COMMON_STRING },
        level: COMMON_LOG_LEVEL,
        redact: { censor: "[REDACTED]", paths: [...COMMON_STRING_ARRAY] },
      },
      isDevelopment: BOOLEAN_FALSE,
      name: "should censor the given redact paths",
      withRedaction: BOOLEAN_TRUE,
    },
    {
      expected: {
        base: { service: COMMON_STRING },
        level: COMMON_LOG_LEVEL,
        redact: { censor: "[REDACTED]", paths: [...COMMON_STRING_ARRAY] },
        transport: PRETTY_TRANSPORT,
      },
      isDevelopment: BOOLEAN_TRUE,
      name: "should combine the transport and redaction in development",
      withRedaction: BOOLEAN_TRUE,
    },
  ],
  PROD_APP_ENV: castAsType<AppEnv>({
    ...VALID_DEV_APP_ENV,
    isDevelopment: BOOLEAN_FALSE,
  }),
  REDACT_PATHS: COMMON_STRING_ARRAY,
} as const;

describe("LoggerHelper", () => {
  describe("buildFallbackLoggerOptions", (it) => {
    it("should return options with only the info level", ({ expect }) => {
      expect(buildFallbackLoggerOptions()).toStrictEqual(
        TEST_DATA.FALLBACK_OPTIONS,
      );
    });
  });

  describe("buildLoggerOptions", (it) => {
    TEST_DATA.OPTIONS_CASES.forEach(
      ({ expected, isDevelopment, name, withRedaction }) => {
        it(name, ({ expect }) => {
          const appEnv = isDevelopment
            ? VALID_DEV_APP_ENV
            : TEST_DATA.PROD_APP_ENV;
          const redactPaths = withRedaction
            ? TEST_DATA.REDACT_PATHS
            : TEST_DATA.EMPTY_REDACT_PATHS;

          expect(buildLoggerOptions(appEnv, redactPaths)).toStrictEqual(
            expected,
          );
        });
      },
    );
  });
});
