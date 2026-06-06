import type { LoggerOptions } from "pino";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ISSUE_CODES } from "@shared/constants/zod.constant";
import { TypesHelper } from "@shared/helpers/types.helper";
import type {
  BindAllIpv4,
  IsDevelopment,
  LogLevel,
  LoopbackHostV4,
  LoopbackHostV4Mapped,
  Port,
  ServiceName,
  ShutdownToken,
  ViteAppEnv,
} from "@shared/types/app-env.type";

import { appEnvSchema } from "./app-env.schema";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("app-env.schema");

const { castAsType } = TypesHelper;

const IP_ADDRESS_MESSAGE = "Must be a valid IPv4 or IPv6 address";
const PORT_FORMAT_MESSAGE = "Must be a string of digits";
const PORT_RANGE_MESSAGE = "Must be between 1 and 65535";
const REQUIRED_INPUT_MESSAGE = "Is required";
const STRING_INPUT_MESSAGE = "Must be a string";

const TEST_DATA = {
  ACCEPTED_PORT_CASES: [
    {
      expected: 1,
      input: "1",
      name: "should accept the smallest legal port",
    },
    {
      expected: 5173,
      input: "5173",
      name: "should accept a typical port",
    },
    {
      expected: 65535,
      input: "65535",
      name: "should accept the largest legal port",
    },
  ],
  ACCEPTED_SERVICE_NAME_CASES: [
    {
      expected: "a",
      input: "a",
      name: "should accept the shortest legal service name",
    },
    {
      expected: "lazy-days",
      input: "lazy-days",
      name: "should accept a typical service name",
    },
  ],
  ACCEPTED_IS_DEVELOPMENT_CASES: [
    {
      expected: true,
      input: "true",
      name: "should parse 'true' to boolean true",
    },
    {
      expected: false,
      input: "false",
      name: "should parse 'false' to boolean false",
    },
  ],
  ACCEPTED_LOG_LEVEL_CASES: [
    {
      expected: "debug",
      input: "debug",
      name: "should accept the debug level",
    },
    {
      expected: "silent",
      input: "silent",
      name: "should accept the silent level",
    },
  ],
  ACCEPTED_BIND_ALL_IPV4_CASES: [
    {
      expected: "0.0.0.0",
      input: "0.0.0.0",
      name: "should accept the bind-all IPv4 address",
    },
    {
      expected: "127.0.0.1",
      input: "127.0.0.1",
      name: "should accept a loopback IPv4 address",
    },
    {
      expected: "::1",
      input: "::1",
      name: "should accept the IPv6 loopback address",
    },
  ],
  ACCEPTED_LOOPBACK_HOST_V4_MAPPED_CASES: [
    {
      expected: "2001:db8:130f::9c0:876a:130b",
      input: "2001:db8:130f::9c0:876a:130b",
      name: "should accept the IPv4-mapped IPv6 loopback",
    },
    {
      expected: "::1",
      input: "::1",
      name: "should accept the plain IPv6 loopback",
    },
  ],
  ACCEPTED_LOOPBACK_HOST_V4_CASES: [
    {
      expected: "127.0.0.1",
      input: "127.0.0.1",
      name: "should accept the IPv4 loopback address",
    },
    {
      expected: "0.0.0.0",
      input: "0.0.0.0",
      name: "should accept a bind-all IPv4 address",
    },
    {
      expected: "::1",
      input: "::1",
      name: "should accept an IPv6 loopback address",
    },
  ],
  REJECTED_BIND_ALL_IPV4_CASES: [
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: REQUIRED_INPUT_MESSAGE,
      input: undefined,
      name: "should reject a missing bind-all address with the required-input message",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: 42,
      name: "should reject a numeric bind-all address input",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: null,
      name: "should reject a null bind-all address input",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "",
      name: "should reject an empty bind-all address with the ip-format message",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "localhost",
      name: "should reject a hostname with the ip-format message",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "256.1.1.1",
      name: "should reject an out-of-range IPv4 octet with the ip-format message",
    },
  ],
  REJECTED_LOOPBACK_HOST_V4_MAPPED_CASES: [
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: REQUIRED_INPUT_MESSAGE,
      input: undefined,
      name: "should reject a missing loopback host with the required-input message",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: 42,
      name: "should reject a numeric loopback host input",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "not-an-ip",
      name: "should reject a non-ip loopback host with the ip-format message",
    },
  ],
  REJECTED_LOOPBACK_HOST_V4_CASES: [
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: REQUIRED_INPUT_MESSAGE,
      input: undefined,
      name: "should reject a missing loopback address with the required-input message",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: 42,
      name: "should reject a numeric loopback address input",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "",
      name: "should reject an empty loopback address with the ip-format message",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "localhost",
      name: "should reject a hostname with the ip-format message",
    },
    {
      expectedCode: ISSUE_CODES.CUSTOM,
      expectedMessage: IP_ADDRESS_MESSAGE,
      input: "999.0.0.1",
      name: "should reject an out-of-range IPv4 octet with the ip-format message",
    },
  ],
  REJECTED_IS_DEVELOPMENT_CASES: [
    { input: "1", name: "should reject the loose truthy '1'" },
    { input: "yes", name: "should reject the loose truthy 'yes'" },
  ],
  REJECTED_LOG_LEVEL_CASES: [
    { input: "verbose", name: "should reject an unknown level" },
    { input: "INFO", name: "should reject a wrong-case level" },
  ],
  EXPECTED_VALID_PARSE: {
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_IS_DEVELOPMENT: false,
    VITE_APP_LOG_LEVEL: "info",
    VITE_APP_LOOPBACK_HOST_V4: "127.0.0.1",
    VITE_APP_LOOPBACK_HOST_V4_MAPPED: "2001:db8:130f::9c0:876a:130b",
    VITE_APP_PORT: 5173,
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN:
      "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  },
  FILLER_BIND_ALL_IPV4: "0.0.0.0",
  FILLER_LOOPBACK_HOST_V4: "127.0.0.1",
  FILLER_LOOPBACK_HOST_V4_MAPPED: "2001:db8:130f::9c0:876a:130b",
  FILLER_PORT: "5173",
  FILLER_SERVICE_NAME: "lazy-days",
  FILLER_SHUTDOWN_TOKEN:
    "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  INVALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_LOOPBACK_HOST_V4: "127.0.0.1",
    VITE_APP_LOOPBACK_HOST_V4_MAPPED: "2001:db8:130f::9c0:876a:130b",
    VITE_APP_PORT: "0",
    VITE_APP_SERVICE_NAME: "",
    VITE_APP_SHUTDOWN_TOKEN:
      "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  }),
  INVALID_PARSE_INPUT: {
    VITE_APP_PORT: "abc",
    VITE_APP_SERVICE_NAME: "",
  },
  MISSING_ENV: castAsType<ImportMetaEnv>({}),
  PORT_FORMAT_MESSAGE,
  PORT_RANGE_MESSAGE,
  REJECTED_PORT_FORMAT_CASES: [
    {
      input: "",
      name: "should reject an empty port string",
    },
    {
      input: " 5173 ",
      name: "should reject a whitespace-padded port",
    },
    {
      input: "0x100",
      name: "should reject a hex literal port",
    },
    {
      input: "1e3",
      name: "should reject a scientific-notation port",
    },
    {
      input: "+5173",
      name: "should reject a signed port",
    },
    {
      input: "-5173",
      name: "should reject a negative-signed port",
    },
    {
      input: "5173.0",
      name: "should reject a decimal port",
    },
  ],
  REJECTED_PORT_RANGE_CASES: [
    {
      expectedCode: ISSUE_CODES.TOO_SMALL,
      input: "0",
      name: "should reject a port below the minimum",
    },
    {
      expectedCode: ISSUE_CODES.TOO_BIG,
      input: "65536",
      name: "should reject a port above the maximum",
    },
  ],
  REJECTED_PORT_TYPE_CASES: [
    {
      expectedMessage: REQUIRED_INPUT_MESSAGE,
      input: undefined,
      name: "should reject a missing port with the required-input message",
    },
    {
      expectedMessage: STRING_INPUT_MESSAGE,
      input: 5173,
      name: "should reject a numeric port input",
    },
    {
      expectedMessage: STRING_INPUT_MESSAGE,
      input: null,
      name: "should reject a null port input",
    },
    {
      expectedMessage: STRING_INPUT_MESSAGE,
      input: true,
      name: "should reject a boolean port input",
    },
    {
      expectedMessage: STRING_INPUT_MESSAGE,
      input: ["5173"],
      name: "should reject an array port input",
    },
  ],
  REJECTED_SERVICE_NAME_CASES: [
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: REQUIRED_INPUT_MESSAGE,
      input: undefined,
      name: "should reject a missing service name with the required-input message",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: 42,
      name: "should reject a numeric service name input",
    },
    {
      expectedCode: ISSUE_CODES.INVALID_TYPE,
      expectedMessage: STRING_INPUT_MESSAGE,
      input: null,
      name: "should reject a null service name input",
    },
    {
      expectedCode: ISSUE_CODES.TOO_SMALL,
      expectedMessage: "Must not be empty",
      input: "",
      name: "should reject an empty service name with the min-length message",
    },
  ],
  REQUIRED_INPUT_MESSAGE,
  STRING_INPUT_MESSAGE,
  VALID_ENV: castAsType<ImportMetaEnv>({
    VITE_APP_BIND_ALL_IPV4: "0.0.0.0",
    VITE_APP_LOOPBACK_HOST_V4: "127.0.0.1",
    VITE_APP_LOOPBACK_HOST_V4_MAPPED: "2001:db8:130f::9c0:876a:130b",
    VITE_APP_PORT: "5173",
    VITE_APP_SERVICE_NAME: "lazy-days",
    VITE_APP_SHUTDOWN_TOKEN:
      "1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
  }),
} as const;

describe("appEnvSchema", () => {
  describe("VITE_APP_PORT", (it) => {
    TEST_DATA.ACCEPTED_PORT_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
          VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
          VITE_APP_LOOPBACK_HOST_V4_MAPPED:
            TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
          VITE_APP_PORT: input,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
        });

        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.VITE_APP_PORT).toBe(expected);
        }
      });
    });

    TEST_DATA.REJECTED_PORT_TYPE_CASES.forEach(
      ({ name, input, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_PORT: input,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const portIssues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_PORT",
            );

            expect(portIssues).toHaveLength(1);
            expect(portIssues[0]?.code).toBe(ISSUE_CODES.INVALID_TYPE);
            expect(portIssues[0]?.message).toBe(expectedMessage);
            expect(portIssues[0]?.path).toStrictEqual(["VITE_APP_PORT"]);
          }
        });
      },
    );

    TEST_DATA.REJECTED_PORT_FORMAT_CASES.forEach(({ name, input }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_PORT: input,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        });

        expect(result.success).toBe(false);

        if (!result.success) {
          const portIssues = result.error.issues.filter(
            (issue) => issue.path[0] === "VITE_APP_PORT",
          );

          expect(portIssues).toHaveLength(1);
          expect(portIssues[0]?.code).toBe(ISSUE_CODES.INVALID_FORMAT);
          expect(portIssues[0]?.message).toBe(TEST_DATA.PORT_FORMAT_MESSAGE);
          expect(portIssues[0]?.path).toStrictEqual(["VITE_APP_PORT"]);
        }
      });
    });

    TEST_DATA.REJECTED_PORT_RANGE_CASES.forEach(
      ({ name, input, expectedCode }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_PORT: input,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const portIssues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_PORT",
            );

            expect(portIssues).toHaveLength(1);
            expect(portIssues[0]?.code).toBe(expectedCode);
            expect(portIssues[0]?.message).toBe(TEST_DATA.PORT_RANGE_MESSAGE);
            expect(portIssues[0]?.path).toStrictEqual(["VITE_APP_PORT"]);
          }
        });
      },
    );

    it("should stop at the regex failure without surfacing range issues", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_PORT: "abc",
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const portIssues = result.error.issues.filter(
          (issue) => issue.path[0] === "VITE_APP_PORT",
        );

        expect(portIssues).toHaveLength(1);
        expect(portIssues[0]?.code).toBe(ISSUE_CODES.INVALID_FORMAT);
      }
    });

    it("should brand the parsed port output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(result.data.VITE_APP_PORT).toEqualTypeOf<Port>();
        expectTypeOf<Port>().not.toEqualTypeOf<number>();
        expectTypeOf<Port>().toExtend<number>();
      }
    });
  });

  describe("VITE_APP_SERVICE_NAME", (it) => {
    TEST_DATA.ACCEPTED_SERVICE_NAME_CASES.forEach(
      ({ name, input, expected }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
            VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
            VITE_APP_LOOPBACK_HOST_V4_MAPPED:
              TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: input,
            VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
          });

          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.VITE_APP_SERVICE_NAME).toBe(expected);
          }
        });
      },
    );

    TEST_DATA.REJECTED_SERVICE_NAME_CASES.forEach(
      ({ name, input, expectedCode, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: input,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const serviceIssues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_SERVICE_NAME",
            );

            expect(serviceIssues).toHaveLength(1);
            expect(serviceIssues[0]?.code).toBe(expectedCode);
            expect(serviceIssues[0]?.message).toBe(expectedMessage);
            expect(serviceIssues[0]?.path).toStrictEqual([
              "VITE_APP_SERVICE_NAME",
            ]);
          }
        });
      },
    );

    it("should brand the parsed service name output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_SERVICE_NAME,
        ).toEqualTypeOf<ServiceName>();
        expectTypeOf<ServiceName>().not.toEqualTypeOf<string>();
        expectTypeOf<ServiceName>().toExtend<string>();
        expectTypeOf<ServiceName>().not.toEqualTypeOf<Port>();
      }
    });
  });

  describe("VITE_APP_IS_DEVELOPMENT", (it) => {
    TEST_DATA.ACCEPTED_IS_DEVELOPMENT_CASES.forEach(
      ({ name, input, expected }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
            VITE_APP_IS_DEVELOPMENT: input,
            VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
            VITE_APP_LOOPBACK_HOST_V4_MAPPED:
              TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
            VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
          });

          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.VITE_APP_IS_DEVELOPMENT).toBe(expected);
          }
        });
      },
    );

    TEST_DATA.REJECTED_IS_DEVELOPMENT_CASES.forEach(({ name, input }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_IS_DEVELOPMENT: input,
          VITE_APP_PORT: TEST_DATA.FILLER_PORT,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        });

        expect(result.success).toBe(false);
      });
    });

    it("should default to false when omitted", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.VITE_APP_IS_DEVELOPMENT).toBe(false);
      }
    });

    it("should brand the parsed development flag", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_IS_DEVELOPMENT,
        ).toEqualTypeOf<IsDevelopment>();
        expectTypeOf<IsDevelopment>().not.toEqualTypeOf<boolean>();
        expectTypeOf<IsDevelopment>().toExtend<boolean>();
      }
    });
  });

  describe("VITE_APP_LOG_LEVEL", (it) => {
    TEST_DATA.ACCEPTED_LOG_LEVEL_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
          VITE_APP_LOG_LEVEL: input,
          VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
          VITE_APP_LOOPBACK_HOST_V4_MAPPED:
            TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
          VITE_APP_PORT: TEST_DATA.FILLER_PORT,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
        });

        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.VITE_APP_LOG_LEVEL).toBe(expected);
        }
      });
    });

    TEST_DATA.REJECTED_LOG_LEVEL_CASES.forEach(({ name, input }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_LOG_LEVEL: input,
          VITE_APP_PORT: TEST_DATA.FILLER_PORT,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        });

        expect(result.success).toBe(false);
      });
    });

    it("should default to info when omitted", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.VITE_APP_LOG_LEVEL).toBe("info");
      }
    });

    it("should brand the parsed log level", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(result.data.VITE_APP_LOG_LEVEL).toEqualTypeOf<LogLevel>();
        expectTypeOf<LogLevel>().not.toEqualTypeOf<
          NonNullable<LoggerOptions["level"]>
        >();
        expectTypeOf<LogLevel>().toExtend<
          NonNullable<LoggerOptions["level"]>
        >();
      }
    });
  });

  describe("VITE_APP_SHUTDOWN_TOKEN", (it) => {
    it("should accept a base64 token of at least 88 characters", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
        VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
        VITE_APP_LOOPBACK_HOST_V4_MAPPED:
          TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
        VITE_APP_PORT: TEST_DATA.FILLER_PORT,
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.VITE_APP_SHUTDOWN_TOKEN).toBe(
          TEST_DATA.FILLER_SHUTDOWN_TOKEN,
        );
      }
    });

    it("should reject a token shorter than 88 characters", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_PORT: TEST_DATA.FILLER_PORT,
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        VITE_APP_SHUTDOWN_TOKEN: "tooShort",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const tokenIssues = result.error.issues.filter(
          (issue) => issue.path[0] === "VITE_APP_SHUTDOWN_TOKEN",
        );

        expect(tokenIssues).toHaveLength(1);
        expect(tokenIssues[0]?.code).toBe(ISSUE_CODES.TOO_SMALL);
      }
    });

    it("should reject a non-base64 token", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_PORT: TEST_DATA.FILLER_PORT,
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        VITE_APP_SHUTDOWN_TOKEN:
          "-234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const tokenIssues = result.error.issues.filter(
          (issue) => issue.path[0] === "VITE_APP_SHUTDOWN_TOKEN",
        );

        expect(tokenIssues).toHaveLength(1);
      }
    });

    it("should reject a missing token with the required-input message", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_PORT: TEST_DATA.FILLER_PORT,
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const tokenIssues = result.error.issues.filter(
          (issue) => issue.path[0] === "VITE_APP_SHUTDOWN_TOKEN",
        );

        expect(tokenIssues).toHaveLength(1);
        expect(tokenIssues[0]?.code).toBe(ISSUE_CODES.INVALID_TYPE);
        expect(tokenIssues[0]?.message).toBe(TEST_DATA.REQUIRED_INPUT_MESSAGE);
      }
    });

    it("should reject a non-string token with the string-type message", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse({
        VITE_APP_PORT: TEST_DATA.FILLER_PORT,
        VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
        VITE_APP_SHUTDOWN_TOKEN: 42,
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        const tokenIssues = result.error.issues.filter(
          (issue) => issue.path[0] === "VITE_APP_SHUTDOWN_TOKEN",
        );

        expect(tokenIssues).toHaveLength(1);
        expect(tokenIssues[0]?.code).toBe(ISSUE_CODES.INVALID_TYPE);
        expect(tokenIssues[0]?.message).toBe(TEST_DATA.STRING_INPUT_MESSAGE);
      }
    });

    it("should brand the parsed shutdown token output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_SHUTDOWN_TOKEN,
        ).toEqualTypeOf<ShutdownToken>();
        expectTypeOf<ShutdownToken>().not.toEqualTypeOf<string>();
        expectTypeOf<ShutdownToken>().toExtend<string>();
      }
    });
  });

  describe("VITE_APP_BIND_ALL_IPV4", (it) => {
    TEST_DATA.ACCEPTED_BIND_ALL_IPV4_CASES.forEach(({ name, input, expected }) => {
      it(name, ({ expect }) => {
        const result = appEnvSchema.safeParse({
          VITE_APP_BIND_ALL_IPV4: input,
          VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
          VITE_APP_LOOPBACK_HOST_V4_MAPPED:
            TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
          VITE_APP_PORT: TEST_DATA.FILLER_PORT,
          VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
        });

        expect(result.success).toBe(true);

        if (result.success) {
          expect(result.data.VITE_APP_BIND_ALL_IPV4).toBe(expected);
        }
      });
    });

    TEST_DATA.REJECTED_BIND_ALL_IPV4_CASES.forEach(
      ({ name, input, expectedCode, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: input,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const bindAllIpv4Issues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_BIND_ALL_IPV4",
            );

            expect(bindAllIpv4Issues).toHaveLength(1);
            expect(bindAllIpv4Issues[0]?.code).toBe(expectedCode);
            expect(bindAllIpv4Issues[0]?.message).toBe(expectedMessage);
            expect(bindAllIpv4Issues[0]?.path).toStrictEqual([
              "VITE_APP_BIND_ALL_IPV4",
            ]);
          }
        });
      },
    );

    it("should brand the parsed bind-all address output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(result.data.VITE_APP_BIND_ALL_IPV4).toEqualTypeOf<BindAllIpv4>();
        expectTypeOf<BindAllIpv4>().not.toEqualTypeOf<string>();
        expectTypeOf<BindAllIpv4>().toExtend<string>();
      }
    });
  });

  describe("VITE_APP_LOOPBACK_HOST_V4_MAPPED", (it) => {
    TEST_DATA.ACCEPTED_LOOPBACK_HOST_V4_MAPPED_CASES.forEach(
      ({ name, input, expected }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
            VITE_APP_LOOPBACK_HOST_V4: TEST_DATA.FILLER_LOOPBACK_HOST_V4,
            VITE_APP_LOOPBACK_HOST_V4_MAPPED: input,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
            VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
          });

          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.VITE_APP_LOOPBACK_HOST_V4_MAPPED).toBe(expected);
          }
        });
      },
    );

    TEST_DATA.REJECTED_LOOPBACK_HOST_V4_MAPPED_CASES.forEach(
      ({ name, input, expectedCode, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
            VITE_APP_LOOPBACK_HOST_V4_MAPPED: input,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const loopbackIssues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_LOOPBACK_HOST_V4_MAPPED",
            );

            expect(loopbackIssues).toHaveLength(1);
            expect(loopbackIssues[0]?.code).toBe(expectedCode);
            expect(loopbackIssues[0]?.message).toBe(expectedMessage);
            expect(loopbackIssues[0]?.path).toStrictEqual([
              "VITE_APP_LOOPBACK_HOST_V4_MAPPED",
            ]);
          }
        });
      },
    );

    it("should brand the parsed loopback host output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_LOOPBACK_HOST_V4_MAPPED,
        ).toEqualTypeOf<LoopbackHostV4Mapped>();
        expectTypeOf<LoopbackHostV4Mapped>().not.toEqualTypeOf<string>();
        expectTypeOf<LoopbackHostV4Mapped>().toExtend<string>();
      }
    });
  });

  describe("VITE_APP_LOOPBACK_HOST_V4", (it) => {
    TEST_DATA.ACCEPTED_LOOPBACK_HOST_V4_CASES.forEach(
      ({ name, input, expected }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_BIND_ALL_IPV4: TEST_DATA.FILLER_BIND_ALL_IPV4,
            VITE_APP_LOOPBACK_HOST_V4: input,
            VITE_APP_LOOPBACK_HOST_V4_MAPPED:
              TEST_DATA.FILLER_LOOPBACK_HOST_V4_MAPPED,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
            VITE_APP_SHUTDOWN_TOKEN: TEST_DATA.FILLER_SHUTDOWN_TOKEN,
          });

          expect(result.success).toBe(true);

          if (result.success) {
            expect(result.data.VITE_APP_LOOPBACK_HOST_V4).toBe(expected);
          }
        });
      },
    );

    TEST_DATA.REJECTED_LOOPBACK_HOST_V4_CASES.forEach(
      ({ name, input, expectedCode, expectedMessage }) => {
        it(name, ({ expect }) => {
          const result = appEnvSchema.safeParse({
            VITE_APP_LOOPBACK_HOST_V4: input,
            VITE_APP_PORT: TEST_DATA.FILLER_PORT,
            VITE_APP_SERVICE_NAME: TEST_DATA.FILLER_SERVICE_NAME,
          });

          expect(result.success).toBe(false);

          if (!result.success) {
            const loopbackV4Issues = result.error.issues.filter(
              (issue) => issue.path[0] === "VITE_APP_LOOPBACK_HOST_V4",
            );

            expect(loopbackV4Issues).toHaveLength(1);
            expect(loopbackV4Issues[0]?.code).toBe(expectedCode);
            expect(loopbackV4Issues[0]?.message).toBe(expectedMessage);
            expect(loopbackV4Issues[0]?.path).toStrictEqual([
              "VITE_APP_LOOPBACK_HOST_V4",
            ]);
          }
        });
      },
    );

    it("should brand the parsed loopback v4 output", ({ expect }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expectTypeOf(
          result.data.VITE_APP_LOOPBACK_HOST_V4,
        ).toEqualTypeOf<LoopbackHostV4>();
        expectTypeOf<LoopbackHostV4>().not.toEqualTypeOf<string>();
        expectTypeOf<LoopbackHostV4>().toExtend<string>();
      }
    });
  });

  describe("aggregate", (it) => {
    it("should return a discriminated-union success branch carrying the parsed record", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.VALID_ENV);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toStrictEqual(TEST_DATA.EXPECTED_VALID_PARSE);
        expectTypeOf(result.data).toEqualTypeOf<ViteAppEnv>();
      }
    });

    it("should aggregate one issue per failing field rather than short-circuit", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.INVALID_ENV);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);

        const paths = result.error.issues.map((issue) => issue.path[0]);

        expect(paths).toContain("VITE_APP_PORT");
        expect(paths).toContain("VITE_APP_SERVICE_NAME");
      }
    });

    it("should aggregate every missing variable when the record is empty", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.MISSING_ENV);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues).toHaveLength(6);

        result.error.issues.forEach((issue) => {
          expect(issue.code).toBe(ISSUE_CODES.INVALID_TYPE);
          expect(issue.message).toBe(TEST_DATA.REQUIRED_INPUT_MESSAGE);
        });

        const paths = result.error.issues.map((issue) => issue.path[0]);

        expect(paths).toContain("VITE_APP_BIND_ALL_IPV4");
        expect(paths).toContain("VITE_APP_LOOPBACK_HOST_V4");
        expect(paths).toContain("VITE_APP_LOOPBACK_HOST_V4_MAPPED");
        expect(paths).toContain("VITE_APP_PORT");
        expect(paths).toContain("VITE_APP_SERVICE_NAME");
        expect(paths).toContain("VITE_APP_SHUTDOWN_TOKEN");
      }
    });

    it("should produce identical issue paths and codes regardless of failing-field order", ({
      expect,
    }) => {
      const firstResult = appEnvSchema.safeParse(TEST_DATA.INVALID_PARSE_INPUT);

      const secondResult = appEnvSchema.safeParse({
        VITE_APP_SERVICE_NAME: "",
        VITE_APP_PORT: "abc",
      });

      expect(firstResult.success).toBe(false);
      expect(secondResult.success).toBe(false);

      if (!firstResult.success && !secondResult.success) {
        const project = (
          issues: typeof firstResult.error.issues,
        ): Array<{
          code: string;
          path: ReadonlyArray<PropertyKey>;
        }> =>
          issues
            .map((issue) => ({ code: issue.code, path: [...issue.path] }))
            .sort((a, b) =>
              String(a.path[0] ?? "").localeCompare(String(b.path[0] ?? "")),
            );

        expect(project(firstResult.error.issues)).toStrictEqual(
          project(secondResult.error.issues),
        );
      }
    });

    it("should strip unknown keys from the parsed output", ({ expect }) => {
      const result = appEnvSchema.safeParse({
        ...TEST_DATA.VALID_ENV,
        VITE_APP_EXTRA: "ignored",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toStrictEqual(TEST_DATA.EXPECTED_VALID_PARSE);
        expect("VITE_APP_EXTRA" in result.data).toBe(false);
      }
    });

    it("should expose the discriminated-union failure branch with an issues array", ({
      expect,
    }) => {
      const result = appEnvSchema.safeParse(TEST_DATA.MISSING_ENV);

      expect(result.success).toBe(false);

      if (!result.success) {
        expectTypeOf(result.error.issues).toBeArray();
        expect(Array.isArray(result.error.issues)).toBe(true);
      }
    });
  });
});
