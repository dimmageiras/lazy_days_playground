import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";
import type { ViteAppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("app-env.helper");

const { castAsType } = TypesHelper;

const { buildAppEnv } = AppEnvHelper;

const VALID_SHUTDOWN_TOKEN =
  "ThisIsAFakeTokenghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890";

const TEST_DATA = {
  EXPECTED_APP_ENV: {
    bindAllIpv4: "0.0.0.0",
    isDevelopment: false,
    logLevel: "info",
    loopbackHostV4: "127.0.0.1",
    loopbackHostV6: "2001:db8:130f::9c0:876a:130b",
    port: 5173,
    serviceName: "lazy-days",
    shutdownToken: VALID_SHUTDOWN_TOKEN,
  },
  VALID_ENV: castAsType<ViteAppEnv>({
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_IS_DEVELOPMENT: false,
    VITE_APP_LOG_LEVEL: "info",
    VITE_APP_LOOPBACK_HOST_V4: "127.0.0.1",
    VITE_APP_LOOPBACK_HOST_V6: "2001:db8:130f::9c0:876a:130b",
    VITE_APP_PORT: 5173,
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN: VALID_SHUTDOWN_TOKEN,
  }),
} as const;

describe("AppEnvHelper", () => {
  describe("buildAppEnv", (it) => {
    it("should map the prefixed vite env keys to their camelCase app env keys", ({
      expect,
    }) => {
      expect(buildAppEnv(TEST_DATA.VALID_ENV)).toStrictEqual(
        TEST_DATA.EXPECTED_APP_ENV,
      );
    });

    it("should return a frozen object", ({ expect }) => {
      expect(Object.isFrozen(buildAppEnv(TEST_DATA.VALID_ENV))).toBe(true);
    });
  });
});
