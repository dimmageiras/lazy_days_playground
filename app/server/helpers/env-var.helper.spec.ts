import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

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
  REJECTED_PORT_FORMAT_CASES: [
    { name: "should reject an empty port string", port: "" },
    { name: "should reject a whitespace-padded port", port: " 5173 " },
    { name: "should reject a hex literal port", port: "0x100" },
    { name: "should reject a scientific-notation port", port: "1e3" },
    { name: "should reject a signed port", port: "+5173" },
    { name: "should reject a decimal port", port: "5173.0" },
  ],
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

    TEST_DATA.REJECTED_PORT_FORMAT_CASES.forEach(({ name, port }) => {
      it(name, ({ expect }) => {
        expect(() =>
          validateEnv(
            castAsType<ImportMetaEnv>({
              VITE_APP_PORT: port,
              VITE_APP_SERVICE_NAME: "lazy-days",
            }),
          ),
        ).toThrow(/VITE_APP_PORT/);
      });
    });
  });
});
