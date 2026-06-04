import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";
import type { AppEnv } from "@shared/types/app-env.type";

import { PinoLoggerModule } from "./pino-logger.module";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("pino-logger.module");

const { castAsType } = TypesHelper;

const { buildLogger } = PinoLoggerModule;

const TEST_DATA = {
  PROD_ENV: castAsType<AppEnv>({
    isDevelopment: false,
    logLevel: "warn",
    port: 5173,
    serviceName: "lazy-days",
  }),
} as const;

describe("PinoLoggerModule", () => {
  describe("buildLogger", (it) => {
    it("should return a logger reporting the configured level", ({
      expect,
    }) => {
      expect(buildLogger(TEST_DATA.PROD_ENV).level).toBe("warn");
    });

    it("should expose the standard log methods", ({ expect }) => {
      const logger = buildLogger(TEST_DATA.PROD_ENV);

      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
    });
  });
});
