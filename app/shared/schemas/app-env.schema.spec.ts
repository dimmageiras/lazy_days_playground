import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { ViteAppEnv } from "@shared/types/app-env.type";

import { appEnvSchema } from "./app-env.schema";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_STRING,
    EMPTY_STRING,
    MAX_PORT,
    MIN_PORT,
    NAN_VALUE,
    NUMBER_1,
    STRING_TRUE,
    UNDEFINED_VALUE,
    VALID_BASE64_TOKEN,
    VALID_RAW_DEV_ENV,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("app-env.schema");

const { validParsedEnv, ...TEST_DATA } = {
  IS_REQUIRED_MESSAGE: "Is required",
  MUST_BE_STRING_MESSAGE: "Must be a string",
  PORT_BOUNDARY_CASES: [
    {
      expected: MIN_PORT,
      name: "should accept the minimum port",
      port: `${MIN_PORT}`,
    },
    {
      expected: MAX_PORT,
      name: "should accept the maximum port",
      port: `${MAX_PORT}`,
    },
  ],
  VITE_APP_BIND_ALL_IPV4: "VITE_APP_BIND_ALL_IPV4",
  VITE_APP_IS_DEVELOPMENT: "VITE_APP_IS_DEVELOPMENT",
  VITE_APP_LOG_LEVEL: "VITE_APP_LOG_LEVEL",
  VITE_APP_PORT: "VITE_APP_PORT",
  VITE_APP_SERVICE_NAME: "VITE_APP_SERVICE_NAME",
  VITE_APP_SHUTDOWN_TOKEN: "VITE_APP_SHUTDOWN_TOKEN",
  get REJECTED_TYPE_CASES() {
    return [
      {
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject a non-string bind-all address",
      },
      {
        key: this.VITE_APP_PORT,
        name: "should reject a non-string port",
      },
      {
        key: this.VITE_APP_SERVICE_NAME,
        name: "should reject a non-string service name",
      },
      {
        key: this.VITE_APP_SHUTDOWN_TOKEN,
        name: "should reject a non-string shutdown token",
      },
    ];
  },
  get REJECTION_CASES() {
    return [
      {
        expectedMessage: "Must be a valid IPv4 address",
        input: COMMON_STRING,
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject a bind address that is not IPv4",
      },
      {
        expectedMessage: "Must be 'true' or 'false'",
        input: COMMON_STRING,
        key: this.VITE_APP_IS_DEVELOPMENT,
        name: "should reject an unrecognised development flag",
      },
      {
        expectedMessage: "Must be a known log level",
        input: COMMON_STRING,
        key: this.VITE_APP_LOG_LEVEL,
        name: "should reject an unknown log level",
      },
      {
        expectedMessage: "Must be a string of digits",
        input: COMMON_STRING,
        key: this.VITE_APP_PORT,
        name: "should reject a non-numeric port",
      },
      {
        expectedMessage: `Must be between ${MIN_PORT} and ${MAX_PORT}`,
        input: `${MIN_PORT - NUMBER_1}`,
        key: this.VITE_APP_PORT,
        name: "should reject a port below the valid range",
      },
      {
        expectedMessage: `Must be between ${MIN_PORT} and ${MAX_PORT}`,
        input: `${MAX_PORT + NUMBER_1}`,
        key: this.VITE_APP_PORT,
        name: "should reject a port above the valid range",
      },
      {
        expectedMessage: "Must not be empty",
        input: EMPTY_STRING,
        key: this.VITE_APP_SERVICE_NAME,
        name: "should reject an empty service name",
      },
      {
        expectedMessage: "Must be at least 88 characters",
        input: COMMON_STRING,
        key: this.VITE_APP_SHUTDOWN_TOKEN,
        name: "should reject a shutdown token shorter than 88 characters",
      },
      {
        expectedMessage: "Must be base64",
        input: `${VALID_BASE64_TOKEN}!`,
        key: this.VITE_APP_SHUTDOWN_TOKEN,
        name: "should reject a shutdown token that is not base64",
      },
    ];
  },
  get REQUIRED_CASES() {
    return [
      {
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject a missing bind-all address",
      },
      {
        key: this.VITE_APP_PORT,
        name: "should reject a missing port",
      },
      {
        key: this.VITE_APP_SERVICE_NAME,
        name: "should reject a missing service name",
      },
      {
        key: this.VITE_APP_SHUTDOWN_TOKEN,
        name: "should reject a missing shutdown token",
      },
    ];
  },
  get validParsedEnv() {
    return () =>
      ({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_IS_DEVELOPMENT: BOOLEAN_TRUE,
        VITE_APP_PORT: Number(VALID_RAW_DEV_ENV.VITE_APP_PORT),
      }) as const;
  },
} as const;

describe("appEnvSchema", () => {
  describe("valid input", (it) => {
    it("should parse a valid env into the branded record", ({ expect }) => {
      const result = appEnvSchema.safeParse(VALID_RAW_DEV_ENV);

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data).toStrictEqual(validParsedEnv());
        expectTypeOf(result.data).toEqualTypeOf<ViteAppEnv>();
      }
    });

    it("should coerce the development flag's true string to a boolean", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_IS_DEVELOPMENT: STRING_TRUE,
      });

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data.VITE_APP_IS_DEVELOPMENT).toBe(BOOLEAN_TRUE);
      }
    });

    TEST_DATA.PORT_BOUNDARY_CASES.forEach(({ name, port, expected }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          ...VALID_RAW_DEV_ENV,
          VITE_APP_PORT: port,
        });

        expect(result.success).toBe(BOOLEAN_TRUE);

        if (result.success) {
          expect(result.data.VITE_APP_PORT).toBe(expected);
        }
      });
    });
  });

  describe("rejections", (it) => {
    TEST_DATA.REJECTED_TYPE_CASES.forEach(({ key, name }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          ...VALID_RAW_DEV_ENV,
          [key]: NAN_VALUE,
        });

        expect(result.success).toBe(BOOLEAN_FALSE);

        if (!result.success) {
          const [issue] = result.error.issues;

          expect(issue?.message).toBe(TEST_DATA.MUST_BE_STRING_MESSAGE);
        }
      });
    });

    TEST_DATA.REQUIRED_CASES.forEach(({ key, name }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          ...VALID_RAW_DEV_ENV,
          [key]: UNDEFINED_VALUE,
        });

        expect(result.success).toBe(BOOLEAN_FALSE);

        if (!result.success) {
          const [issue] = result.error.issues;

          expect(issue?.message).toBe(TEST_DATA.IS_REQUIRED_MESSAGE);
        }
      });
    });

    TEST_DATA.REJECTION_CASES.forEach(
      ({ name, key, input, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            ...VALID_RAW_DEV_ENV,
            [key]: input,
          });

          expect(result.success).toBe(BOOLEAN_FALSE);

          if (!result.success) {
            const [issue] = result.error.issues;

            expect(issue?.message).toBe(expectedMessage);
          }
        });
      },
    );
  });
});
