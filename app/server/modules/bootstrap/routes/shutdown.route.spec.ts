import { VitestSetup } from "@configs/vitest/setup";
import type { OnTestFinishedHandler } from "vitest";
import { describe, vi } from "vitest";

import { shutdownRoute } from "./shutdown.route";

const { createTestApp, trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("shutdown.route");

const TEST_DATA = {
  LOOPBACK_HOST_V4: "127.0.0.1",
  NON_LOOPBACK_IP: "127.0.0.2",
  RESPONSE_CASES: [
    {
      name: "should respond 401 when the token header is missing",
      headers: {},
      remoteAddress: "127.0.0.1",
      expectedStatus: 401,
    },
    {
      name: "should respond 401 when the token does not match",
      headers: { "x-shutdown-token": "wrong-token" },
      remoteAddress: "127.0.0.1",
      expectedStatus: 401,
    },
    {
      name: "should respond 401 when the request comes from a non-loopback IP",
      headers: { "x-shutdown-token": "expected-token" },
      remoteAddress: "127.0.0.2",
      expectedStatus: 401,
    },
    {
      name: "should respond 202 when the request is loopback with a valid token",
      headers: { "x-shutdown-token": "expected-token" },
      remoteAddress: "127.0.0.1",
      expectedStatus: 202,
    },
  ],
  SHUTDOWN_PATH: "/internal/shutdown",
  SHUTDOWN_TOKEN_HEADER: "x-shutdown-token",
  TOKEN: "expected-token",
  WRONG_TOKEN: "wrong-token",
} as const;

const createRouteApp = async (
  onTestFinished: (fn: OnTestFinishedHandler) => void,
) => {
  const app = createTestApp(onTestFinished);
  const closeListeners = {
    close: vi.fn(),
    uninstall: vi.fn(),
  };

  await app.register(shutdownRoute, {
    closeListeners,
    token: TEST_DATA.TOKEN,
  });

  await app.ready();

  return { app, closeListeners };
};

describe("shutdownRoute", () => {
  describe("plugin", (it) => {
    TEST_DATA.RESPONSE_CASES.forEach(
      ({ name, headers, remoteAddress, expectedStatus }) => {
        it(name, async ({ expect, onTestFinished }) => {
          const { app, closeListeners } = await createRouteApp(onTestFinished);

          const response = await app.inject({
            headers,
            method: "POST",
            remoteAddress,
            url: TEST_DATA.SHUTDOWN_PATH,
          });

          expect(response.statusCode).toBe(expectedStatus);
          expect(closeListeners.close.mock.calls.length).toBe(
            expectedStatus === 202 ? 1 : 0,
          );
        });
      },
    );
  });
});
