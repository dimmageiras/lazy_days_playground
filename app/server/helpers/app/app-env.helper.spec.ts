import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { AppEnvHelper } from "./app-env.helper";

const {
  sharedTestData: { BOOLEAN_TRUE, VALID_DEV_APP_ENV, VALID_VITE_APP_ENV },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("app-env.helper");

const { buildAppEnv } = AppEnvHelper;

const TEST_DATA = {
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

    it("should return a frozen object", ({ expect }) => {
      expect(Object.isFrozen(buildAppEnv(TEST_DATA.VITE_APP_ENV))).toBe(
        BOOLEAN_TRUE,
      );
    });
  });
});
