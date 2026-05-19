import { VitestSetup } from "@configs/vitest/setup";
import type { FastifyBaseLogger } from "fastify";
import type { ExpectStatic } from "vitest";
import { beforeEach, describe, vi } from "vitest";

import { ShutdownRequestHelper } from "./shutdown-request.helper";

const createFakeLog = (): FastifyBaseLogger => ({
  child: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  info: vi.fn(),
  level: "info",
  silent: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
});

const { mockAxiosPost, trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("shutdown-request.helper");

const { requestCooperativeShutdown } = ShutdownRequestHelper;

const TEST_DATA = {
  EXPECTED_URL: "http://127.0.0.1:5173/internal/shutdown",
  PORT: 5173,
  REQUEST_SHAPE_CASES: [
    {
      name: "should POST to the loopback IPv4 shutdown URL with the given port",
      buildExpectedArgs: (expect: ExpectStatic): readonly unknown[] => [
        TEST_DATA.EXPECTED_URL,
        {},
        expect.any(Object),
      ],
    },
    {
      name: "should send the shutdown token header on the request",
      buildExpectedArgs: (expect: ExpectStatic): readonly unknown[] => [
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            [TEST_DATA.SHUTDOWN_TOKEN_HEADER]: TEST_DATA.TOKEN,
          }),
        }),
      ],
    },
    {
      name: "should configure an AbortSignal for the request timeout",
      buildExpectedArgs: (expect: ExpectStatic): readonly unknown[] => [
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      ],
    },
  ],
  RESULT_CASES: [
    {
      name: "should resolve to true when axios.post resolves",
      expected: true,
      setupMock: (): void => {
        mockAxiosPost.mockResolvedValueOnce(undefined);
      },
    },
    {
      name: "should resolve to false when axios.post rejects",
      expected: false,
      setupMock: (): void => {
        mockAxiosPost.mockRejectedValueOnce(new Error("network down"));
      },
    },
  ],
  SHUTDOWN_TOKEN_HEADER: "x-shutdown-token",
  TOKEN: "test-token-value",
} as const;

const RESET_MOCK_ARRAY = [mockAxiosPost];

describe("ShutdownRequestHelper", () => {
  beforeEach(({ onTestFinished }) => {
    onTestFinished(() => {
      for (const mock of RESET_MOCK_ARRAY) {
        mock.mockReset();
      }
    });
  });

  describe("requestCooperativeShutdown", (it) => {
    TEST_DATA.RESULT_CASES.forEach(({ name, expected, setupMock }) => {
      it(name, async ({ expect }) => {
        setupMock();

        const result = await requestCooperativeShutdown({
          log: createFakeLog(),
          port: TEST_DATA.PORT,
          token: TEST_DATA.TOKEN,
        });

        expect(result).toBe(expected);
      });
    });

    TEST_DATA.REQUEST_SHAPE_CASES.forEach(({ name, buildExpectedArgs }) => {
      it(name, async ({ expect }) => {
        mockAxiosPost.mockResolvedValueOnce(undefined);

        await requestCooperativeShutdown({
          log: createFakeLog(),
          port: TEST_DATA.PORT,
          token: TEST_DATA.TOKEN,
        });

        expect(mockAxiosPost.mock.calls).toContainEqual(
          buildExpectedArgs(expect),
        );
      });
    });
  });
});
