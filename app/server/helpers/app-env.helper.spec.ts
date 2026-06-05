import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("app-env.helper");

const { castAsType } = TypesHelper;

const { buildAppEnv } = AppEnvHelper;

const TEST_DATA = {
  EXPECTED_APP_ENV: {
    isDevelopment: false,
    logLevel: "info",
    port: 5173,
    serviceName: "lazy-days",
    shutdownToken:
      "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  },
  VALID_ENV: castAsType<ViteAppEnv>({
    VITE_APP_IS_DEVELOPMENT: false,
    VITE_APP_LOG_LEVEL: "info",
    VITE_APP_PORT: 5173,
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN:
      "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  }),
} as const;

describe("AppEnvHelper", () => {
  describe("buildAppEnv", (it) => {
    it("should map the prefixed vite env keys to their camelCase app env keys", ({
      expect,
    }) => {
      expect(buildAppEnv(TEST_DATA.VALID_ENV)).toEqual(TEST_DATA.EXPECTED_APP_ENV);
    });

    it("should return a frozen object", ({ expect }) => {
      expect(Object.isFrozen(buildAppEnv(TEST_DATA.VALID_ENV))).toBe(true);
    });
  });
});
