import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/logger.constant";
import { LoggerHelper } from "./logger.helper";

const {
  sharedTestData: { EMPTY_ARRAY },
  trackLeaksInSpec,
} = await VitestSetup();

trackLeaksInSpec("logger.helper");

const { castAsType } = TypesHelper;

const { buildFallbackLoggerOptions, buildLoggerOptions } = LoggerHelper;

const TEST_DATA = {
  DEV_ENV: castAsType<AppEnv>({
    isDevelopment: true,
    logLevel: "debug",
    port: 5173,
    serviceName: "lazy-days",
  }),
  PROD_ENV: castAsType<AppEnv>({
    isDevelopment: false,
    logLevel: "info",
    port: 5173,
    serviceName: "lazy-days",
  }),
} as const;

describe("LoggerHelper", () => {
  describe("buildFallbackLoggerOptions", (it) => {
    it("should default to the info level", ({ expect }) => {
      expect(buildFallbackLoggerOptions().level).toBe("info");
    });

    it("should not attach a transport", ({ expect }) => {
      expect("transport" in buildFallbackLoggerOptions()).toBe(false);
    });
  });

  describe("buildLoggerOptions", (it) => {
    it("should set the level from the env", ({ expect }) => {
      expect(buildLoggerOptions(TEST_DATA.DEV_ENV, EMPTY_ARRAY).level).toBe(
        "debug",
      );
    });

    it("should put the service name on the base", ({ expect }) => {
      expect(
        buildLoggerOptions(TEST_DATA.PROD_ENV, EMPTY_ARRAY).base,
      ).toStrictEqual({
        service: "lazy-days",
      });
    });

    it("should attach the pretty transport in development", ({ expect }) => {
      expect(buildLoggerOptions(TEST_DATA.DEV_ENV, EMPTY_ARRAY).transport).toBe(
        PRETTY_TRANSPORT,
      );
    });

    it("should omit the transport outside development", ({ expect }) => {
      expect(
        "transport" in buildLoggerOptions(TEST_DATA.PROD_ENV, EMPTY_ARRAY),
      ).toBe(false);
    });
  });
});
