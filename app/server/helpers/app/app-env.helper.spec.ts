import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { AppEnv } from "@shared/types/app-env.type";

import { AppEnvHelper } from "./app-env.helper";

const {
  sharedTestData: { BOOLEAN_TRUE, VALID_DEV_APP_ENV, VALID_VITE_APP_ENV },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("app-env.helper");

const { buildAppEnv } = AppEnvHelper;

const TEST_DATA = {
  APP_ENV_KEYS: [
    "bindAllIpv4",
    "dbBranch",
    "dbClientTlsSecurity",
    "dbHost",
    "dbName",
    "dbPassword",
    "dbPort",
    "isDevelopment",
    "logLevel",
    "port",
    "serviceName",
    "shutdownToken",
  ],
  VITE_APP_ENV: VALID_VITE_APP_ENV,
} as const;

describe("AppEnvHelper", () => {
  describe("buildAppEnv", (it) => {
    it("should map the prefixed vite env keys to their camelCase app env keys", ({
      expect,
    }) => {
      expect(buildAppEnv(TEST_DATA.VITE_APP_ENV)).toStrictEqual(
        VALID_DEV_APP_ENV,
      );
    });

    it("should derive exactly the expected camelCase keys, matching the AppEnv type", ({
      expect,
    }) => {
      expect(
        Object.keys(buildAppEnv(TEST_DATA.VITE_APP_ENV)).sort((a, b) =>
          a.localeCompare(b),
        ),
      ).toStrictEqual(
        [...TEST_DATA.APP_ENV_KEYS].sort((a, b) => a.localeCompare(b)),
      );

      expectTypeOf<keyof AppEnv>().toEqualTypeOf<
        (typeof TEST_DATA.APP_ENV_KEYS)[number]
      >();
    });

    it("should return a frozen object", ({ expect }) => {
      expect(Object.isFrozen(buildAppEnv(TEST_DATA.VITE_APP_ENV))).toBe(
        BOOLEAN_TRUE,
      );
    });
  });
});
