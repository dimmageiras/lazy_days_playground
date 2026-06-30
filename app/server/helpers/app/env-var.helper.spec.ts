import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TypeHelper } from "@shared/helpers/type.helper";

import { EnvVarHelper } from "./env-var.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_STRING,
    EMPTY_OBJECT,
    EMPTY_STRING,
    MIN_PORT,
    VALID_PORT,
    VALID_RAW_DEV_ENV,
    VALID_VITE_APP_ENV,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("env-var.helper");

const { castAsType } = TypeHelper;

const { isEnvValidationError, validateEnv } = EnvVarHelper;

const TEST_DATA = {
  EXPECTED_VALIDATED_ENV: VALID_VITE_APP_ENV,
  INVALID_ENV: {
    ...VALID_RAW_DEV_ENV,
    VITE_APP_PORT: `${MIN_PORT - 1}`,
    VITE_APP_SERVICE_NAME: EMPTY_STRING,
  },
  MISSING_ENV: castAsType<ImportMetaEnv>(EMPTY_OBJECT),
  REJECTED_PORT_FORMAT_CASES: [
    { name: "should reject an empty port string", port: EMPTY_STRING },
    { name: "should reject a whitespace-padded port", port: ` ${VALID_PORT} ` },
    { name: "should reject a hex literal port", port: "0x100" },
    { name: "should reject a scientific-notation port", port: "1e3" },
    { name: "should reject a signed port", port: `+${VALID_PORT}` },
    { name: "should reject a negative-signed port", port: `-${VALID_PORT}` },
    { name: "should reject a decimal port", port: `${VALID_PORT}.0` },
  ],
  VALID_ENV: VALID_RAW_DEV_ENV,
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

    it("should join one line per missing required variable", ({ expect }) => {
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
              ...VALID_RAW_DEV_ENV,
              VITE_APP_PORT: port,
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

      expect(isEnvValidationError(thrown)).toBe(BOOLEAN_TRUE);

      if (isEnvValidationError(thrown)) {
        expectTypeOf(thrown).toEqualTypeOf<Error>();
      }
    });

    it("should reject an unrelated error", ({ expect }) => {
      expect(isEnvValidationError(new Error(COMMON_STRING))).toBe(
        BOOLEAN_FALSE,
      );
    });

    it("should reject a non-error value", ({ expect }) => {
      expect(isEnvValidationError(COMMON_STRING)).toBe(BOOLEAN_FALSE);
    });
  });
});
