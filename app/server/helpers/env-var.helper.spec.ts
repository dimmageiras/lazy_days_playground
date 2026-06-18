import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypesHelper } from "@shared/helpers/types.helper";

import { EnvVarHelper } from "./env-var.helper";

const {
  sharedTestData: { EMPTY_OBJECT, EMPTY_STRING },
  trackLeaksInSpec,
}: Awaited<ReturnType<typeof VitestSetup>> = await VitestSetup();

trackLeaksInSpec("env-var.helper");

const { castAsType } = TypesHelper;

const { isEnvValidationError, validateEnv } = EnvVarHelper;

const VALID_SHUTDOWN_TOKEN =
  "ThisIsAFakeTokenghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890";

const TEST_DATA = {
  EXPECTED_VALIDATED_ENV: {
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_IS_DEVELOPMENT: false,
    VITE_APP_LOG_LEVEL: "info",
    VITE_APP_PORT: 5173,
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN: VALID_SHUTDOWN_TOKEN,
  },
  INVALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_PORT: "0",
    VITE_APP_SERVICE_NAME: EMPTY_STRING,
  }),
  MISSING_ENV: castAsType<ImportMetaEnv>(EMPTY_OBJECT),
  REJECTED_PORT_FORMAT_CASES: [
    { name: "should reject an empty port string", port: EMPTY_STRING },
    { name: "should reject a whitespace-padded port", port: " 5173 " },
    { name: "should reject a hex literal port", port: "0x100" },
    { name: "should reject a scientific-notation port", port: "1e3" },
    { name: "should reject a signed port", port: "+5173" },
    { name: "should reject a negative-signed port", port: "-5173" },
    { name: "should reject a decimal port", port: "5173.0" },
  ],
  VALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_PORT: "5173",
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN: VALID_SHUTDOWN_TOKEN,
  }),
} as const;

describe("EnvVarHelper", () => {
  describe("validateEnv", (it) => {
    it("should return the validated branded record for a valid env", ({
      expect,
    }) => {
      expect(validateEnv(TEST_DATA.VALID_ENV)).toStrictEqual(
        TEST_DATA.EXPECTED_VALIDATED_ENV,
      );
    });

    it("should throw a message naming both the invalid port and the empty service name", ({
      expect,
    }) => {
      expect(() => validateEnv(TEST_DATA.INVALID_ENV)).toThrow(/VITE_APP_PORT/);
      expect(() => validateEnv(TEST_DATA.INVALID_ENV)).toThrow(
        /VITE_APP_SERVICE_NAME/,
      );
    });

    it("should join one line per missing variable", ({ expect }) => {
      let message: string = EMPTY_STRING;

      try {
        validateEnv(TEST_DATA.MISSING_ENV);
      } catch (error) {
        message = castAsType<Error>(error).message;
      }

      const issueLines = message
        .split("\n")
        .filter((line) => line.startsWith("- "));

      expect(issueLines).toHaveLength(4);
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

  describe("isEnvValidationError", (it) => {
    it("should identify the error validateEnv throws on a failed parse", ({
      expect,
    }) => {
      let thrown: unknown;

      try {
        validateEnv(TEST_DATA.MISSING_ENV);
      } catch (error) {
        thrown = error;
      }

      expect(isEnvValidationError(thrown)).toBe(true);
    });

    it("should reject an unrelated error", ({ expect }) => {
      expect(isEnvValidationError(new Error("boom"))).toBe(false);
    });
  });
});
