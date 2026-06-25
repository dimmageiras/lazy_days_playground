import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { appEnvSchema } from "@shared/schemas/app-env.schema";

import { AppEnvHelper } from "./app-env.helper";

const {
  sharedTestData: { BOOLEAN_TRUE, VALID_DEV_APP_ENV, VALID_RAW_DEV_ENV },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("app-env.helper");

const { buildAppEnv } = AppEnvHelper;

const TEST_DATA = {
  VITE_APP_ENV: appEnvSchema.parse(VALID_RAW_DEV_ENV),
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
