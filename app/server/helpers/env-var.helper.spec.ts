import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { TypesHelper } from "@shared/helpers/types.helper";

import { EnvVarHelper } from "./env-var.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("env-var.helper");

const { castAsType } = TypesHelper;

const { validateEnv } = EnvVarHelper;

const TEST_DATA = {
  INVALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_PORT: "0",
    VITE_APP_SERVICE_NAME: "",
  }),
  MISSING_ENV: castAsType<ImportMetaEnv>({}),
  VALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_PORT: "5173",
    VITE_APP_SERVICE_NAME: "lazy-days",
  }),
} as const;

describe("EnvVarHelper", () => {
  describe("validateEnv", (it) => {
    it("should return the validated branded record for a valid env", ({
      expect,
    }) => {
      expect(validateEnv(TEST_DATA.VALID_ENV)).toEqual({
        VITE_APP_PORT: 5173,
        VITE_APP_SERVICE_NAME: "lazy-days",
      });
    });

    it("should throw an aggregated message for an out-of-range port and empty service name", ({
      expect,
    }) => {
      expect(() => validateEnv(TEST_DATA.INVALID_ENV)).toThrow(
        /VITE_APP_PORT[\s\S]*VITE_APP_SERVICE_NAME/,
      );
    });

    it("should join one line per missing variable", ({ expect }) => {
      let message = "";

      try {
        validateEnv(TEST_DATA.MISSING_ENV);
      } catch (error) {
        message = castAsType<Error>(error).message;
      }

      const issueLines = message
        .split("\n")
        .filter((line) => line.startsWith("- "));

      expect(issueLines).toHaveLength(2);
    });
  });
});
