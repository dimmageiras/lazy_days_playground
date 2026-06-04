import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { PRETTY_TRANSPORT } from "../constants/pino-logger.constant";
import { PinoLoggerHelper } from "./pino-logger.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("pino-logger.helper");

const { castAsType } = TypesHelper;

const { buildLoggerOptions } = PinoLoggerHelper;

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

describe("PinoLoggerHelper", () => {
  describe("buildLoggerOptions", (it) => {
    it("should set the level from the env", ({ expect }) => {
      expect(buildLoggerOptions(TEST_DATA.DEV_ENV).level).toBe("debug");
    });

    it("should put the service name on the base", ({ expect }) => {
      expect(buildLoggerOptions(TEST_DATA.PROD_ENV).base).toStrictEqual({
        service: "lazy-days",
      });
    });

    it("should attach the pretty transport in development", ({ expect }) => {
      expect(buildLoggerOptions(TEST_DATA.DEV_ENV).transport).toBe(
        PRETTY_TRANSPORT,
      );
    });

    it("should omit the transport outside development", ({ expect }) => {
      expect("transport" in buildLoggerOptions(TEST_DATA.PROD_ENV)).toBe(false);
    });
  });
});
