import type { LoggerOptions } from "pino";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { ObjectHelper } from "@shared/helpers/object.helper";
import { TypeHelper } from "@shared/helpers/type.helper";
import type {
  BindAllIpv4,
  IsDevelopment,
  LogLevel,
  Port,
  ServiceName,
  ShutdownToken,
  ViteAppEnv,
} from "@shared/types/app-env.type";

import { appEnvSchema } from "./app-env.schema";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_LOG_LEVEL,
    COMMON_STRING,
    EMPTY_STRING,
    LOCALHOST,
    MAX_PORT,
    MIN_PORT,
    NAN_VALUE,
    NUMBER_1,
    STRING_TRUE,
    UNDEFINED_VALUE,
    VALID_BASE64_TOKEN,
    VALID_PORT_1,
    VALID_PORT_2,
    VALID_RAW_DEV_ENV,
    VALID_VITE_APP_ENV,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("app-env.schema");

const { getObjectKeys } = ObjectHelper;
const { castAsType } = TypeHelper;

const getEnvKeys = getObjectKeys(VALID_RAW_DEV_ENV);

const TEST_DATA = {
  ALPHABETIC_PORT: COMMON_STRING,
  DECIMAL_PORT: `${VALID_PORT_1}.0`,
  HOST_WITH_PORT: `${LOCALHOST}:${VALID_PORT_2}`,
  IPV6_ADDRESS: "::1",
  IS_REQUIRED_MESSAGE: "Is required",
  LOOSE_TRUTHY_FLAG: `${NUMBER_1}`,
  MUST_BE_STRING_MESSAGE: "Must be a string",
  PORT_FORMAT_MESSAGE: "Must be a string of digits",
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
  UNKNOWN_KEY: "VITE_APP_EXTRA",
  WRONG_CASE_LOG_LEVEL: "INFO",
  ...castAsType<{ [Key in keyof ViteAppEnv]: Key }>(
    Object.fromEntries(getEnvKeys.map((key) => [key, key])),
  ),
  get REJECTED_TYPE_CASES() {
    return [
      {
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject a non-string bind-all address",
      },
      {
        key: this.VITE_APP_DB_BRANCH,
        name: "should reject a non-string DB branch",
      },
      {
        key: this.VITE_APP_DB_HOST,
        name: "should reject a non-string DB host",
      },
      {
        key: this.VITE_APP_DB_NAME,
        name: "should reject a non-string DB name",
      },
      {
        key: this.VITE_APP_DB_PASSWORD,
        name: "should reject a non-string DB password",
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
        expectedCode: ISSUE_CODES.CUSTOM,
        expectedMessage: "Must be a valid IPv4 address",
        input: COMMON_STRING,
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject a bind address that is not IPv4",
      },
      {
        expectedCode: ISSUE_CODES.CUSTOM,
        expectedMessage: "Must be a valid IPv4 address",
        input: this.IPV6_ADDRESS,
        key: this.VITE_APP_BIND_ALL_IPV4,
        name: "should reject an IPv6 bind address",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
        expectedMessage: "Must not be empty",
        input: EMPTY_STRING,
        key: this.VITE_APP_DB_NAME,
        name: "should reject an empty DB name",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
        expectedMessage: "Must not be empty",
        input: EMPTY_STRING,
        key: this.VITE_APP_DB_BRANCH,
        name: "should reject an empty DB branch",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
        expectedMessage: "Must not be empty",
        input: EMPTY_STRING,
        key: this.VITE_APP_DB_PASSWORD,
        name: "should reject an empty DB password",
      },
      {
        expectedCode: ISSUE_CODES.CUSTOM,
        expectedMessage: "Must be a valid IPv4 address or hostname",
        input: COMMON_STRING,
        key: this.VITE_APP_DB_HOST,
        name: "should reject a DB host that is not a valid host",
      },
      {
        expectedCode: ISSUE_CODES.CUSTOM,
        expectedMessage: "Must be a valid IPv4 address or hostname",
        input: this.HOST_WITH_PORT,
        key: this.VITE_APP_DB_HOST,
        name: "should reject a DB host that includes a port",
      },
      {
        expectedMessage: "Must be a known TLS security mode",
        input: COMMON_STRING,
        key: this.VITE_APP_DB_CLIENT_TLS_SECURITY,
        name: "should reject an unknown DB TLS security mode",
      },
      {
        expectedMessage: "Must be 'true' or 'false'",
        input: COMMON_STRING,
        key: this.VITE_APP_IS_DEVELOPMENT,
        name: "should reject an unrecognised development flag",
      },
      {
        expectedMessage: "Must be 'true' or 'false'",
        input: this.LOOSE_TRUTHY_FLAG,
        key: this.VITE_APP_IS_DEVELOPMENT,
        name: "should reject a loose-truthy development flag",
      },
      {
        expectedMessage: "Must be a known log level",
        input: COMMON_STRING,
        key: this.VITE_APP_LOG_LEVEL,
        name: "should reject an unknown log level",
      },
      {
        expectedMessage: "Must be a known log level",
        input: this.WRONG_CASE_LOG_LEVEL,
        key: this.VITE_APP_LOG_LEVEL,
        name: "should reject a wrong-case log level",
      },
      {
        expectedMessage: "Must be a string of digits",
        input: COMMON_STRING,
        key: this.VITE_APP_PORT,
        name: "should reject a non-numeric port",
      },
      {
        expectedMessage: this.PORT_FORMAT_MESSAGE,
        input: this.DECIMAL_PORT,
        key: this.VITE_APP_PORT,
        name: "should reject a decimal port",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
        expectedMessage: `Must be between ${MIN_PORT} and ${MAX_PORT}`,
        input: `${MIN_PORT - 1}`,
        key: this.VITE_APP_PORT,
        name: "should reject a port below the valid range",
      },
      {
        expectedCode: ISSUE_CODES.TOO_BIG,
        expectedMessage: `Must be between ${MIN_PORT} and ${MAX_PORT}`,
        input: `${MAX_PORT + 1}`,
        key: this.VITE_APP_PORT,
        name: "should reject a port above the valid range",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
        expectedMessage: "Must not be empty",
        input: EMPTY_STRING,
        key: this.VITE_APP_SERVICE_NAME,
        name: "should reject an empty service name",
      },
      {
        expectedCode: ISSUE_CODES.TOO_SMALL,
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
        key: this.VITE_APP_DB_BRANCH,
        name: "should reject a missing DB branch",
      },
      {
        key: this.VITE_APP_DB_HOST,
        name: "should reject a missing DB host",
      },
      {
        key: this.VITE_APP_DB_NAME,
        name: "should reject a missing DB name",
      },
      {
        key: this.VITE_APP_DB_PASSWORD,
        name: "should reject a missing DB password",
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
} as const;

describe("appEnvSchema", () => {
  describe("valid input", (it) => {
    it("should parse a valid env into the branded record", ({ expect }) => {
      const result = appEnvSchema.safeParse(VALID_RAW_DEV_ENV);

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data).toStrictEqual(VALID_VITE_APP_ENV);
        expectTypeOf(result.data).toEqualTypeOf<ViteAppEnv>();
      }
    });

    it("should brand each parsed field's output type", ({ expect }) => {
      const result = appEnvSchema.safeParse(VALID_RAW_DEV_ENV);

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_BIND_ALL_IPV4,
        ).not.toEqualTypeOf<string>();
        expectTypeOf(
          result.data.VITE_APP_BIND_ALL_IPV4,
        ).toEqualTypeOf<BindAllIpv4>();
        expectTypeOf(
          result.data.VITE_APP_IS_DEVELOPMENT,
        ).not.toEqualTypeOf<boolean>();
        expectTypeOf(
          result.data.VITE_APP_IS_DEVELOPMENT,
        ).toEqualTypeOf<IsDevelopment>();
        expectTypeOf(result.data.VITE_APP_LOG_LEVEL).not.toEqualTypeOf<
          NonNullable<LoggerOptions["level"]>
        >();
        expectTypeOf(result.data.VITE_APP_LOG_LEVEL).toEqualTypeOf<LogLevel>();
        expectTypeOf(result.data.VITE_APP_PORT).not.toEqualTypeOf<number>();
        expectTypeOf(result.data.VITE_APP_PORT).toEqualTypeOf<Port>();
        expectTypeOf(
          result.data.VITE_APP_SERVICE_NAME,
        ).not.toEqualTypeOf<string>();
        expectTypeOf(
          result.data.VITE_APP_SERVICE_NAME,
        ).toEqualTypeOf<ServiceName>();
        expectTypeOf(
          result.data.VITE_APP_SHUTDOWN_TOKEN,
        ).not.toEqualTypeOf<string>();
        expectTypeOf(
          result.data.VITE_APP_SHUTDOWN_TOKEN,
        ).toEqualTypeOf<ShutdownToken>();
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

    it("should normalize the DB host to lower case", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_DB_HOST: LOCALHOST.toUpperCase(),
      });

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data.VITE_APP_DB_HOST).toBe(LOCALHOST);
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

    it("should default the development flag to false when omitted", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_IS_DEVELOPMENT: UNDEFINED_VALUE,
      });

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data.VITE_APP_IS_DEVELOPMENT).toBe(BOOLEAN_FALSE);
      }
    });

    it("should default the log level to info when omitted", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_LOG_LEVEL: UNDEFINED_VALUE,
      });

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data.VITE_APP_LOG_LEVEL).toBe(COMMON_LOG_LEVEL);
      }
    });

    it("should strip unknown keys from the parsed output", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        [TEST_DATA.UNKNOWN_KEY]: COMMON_STRING,
      });

      expect(result.success).toBe(BOOLEAN_TRUE);

      if (result.success) {
        expect(result.data).toStrictEqual(VALID_VITE_APP_ENV);
        expect(TEST_DATA.UNKNOWN_KEY in result.data).toBe(BOOLEAN_FALSE);
      }
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
      ({ expectedCode, expectedMessage, input, key, name }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            ...VALID_RAW_DEV_ENV,
            [key]: input,
          });

          expect(result.success).toBe(BOOLEAN_FALSE);

          if (!result.success) {
            const [issue] = result.error.issues;

            expect(issue?.message).toBe(expectedMessage);

            if (expectedCode) {
              expect(issue?.code).toBe(expectedCode);
            }
          }
        });
      },
    );

    it("should surface exactly one format issue for an alphabetic port", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        VITE_APP_PORT: TEST_DATA.ALPHABETIC_PORT,
      });

      expect(result.success).toBe(BOOLEAN_FALSE);

      if (!result.success) {
        const portIssues = result.error.issues.filter(
          (issue) => issue.path[0] === TEST_DATA.VITE_APP_PORT,
        );

        expect(portIssues).toHaveLength(1);
        expect(portIssues[0]?.code).toBe(ISSUE_CODES.INVALID_FORMAT);
        expect(portIssues[0]?.message).toBe(TEST_DATA.PORT_FORMAT_MESSAGE);
      }
    });

    it("should aggregate one issue per failing field rather than short-circuit", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        ...VALID_RAW_DEV_ENV,
        [TEST_DATA.VITE_APP_PORT]: TEST_DATA.ALPHABETIC_PORT,
        [TEST_DATA.VITE_APP_SERVICE_NAME]: EMPTY_STRING,
      });

      expect(result.success).toBe(BOOLEAN_FALSE);

      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path[0]);

        expect(result.error.issues).toHaveLength(2);
        expect(paths).toContain(TEST_DATA.VITE_APP_PORT);
        expect(paths).toContain(TEST_DATA.VITE_APP_SERVICE_NAME);
      }
    });
  });
});
