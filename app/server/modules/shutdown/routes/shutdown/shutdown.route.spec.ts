import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { API_INTERNAL_ENDPOINTS } from "@server/constants/endpoints.constant";
import { HEADERS } from "@server/constants/headers.constant";
import { HOSTS } from "@server/constants/hosts.constant";
import type { ShutdownRouteOptions } from "@server/modules/shutdown/types/shutdown.type";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { shutdownRoute } from "./shutdown.route";

const {
  createTestApp,
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_STRING,
    VALID_DEV_APP_ENV,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("shutdown.route");

const { castAsType } = TypeHelper;

const { SHUTDOWN } = API_INTERNAL_ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const TEST_DATA = {
  RESPONSE_CASES: [
    {
      expectedAccepted: BOOLEAN_FALSE,
      expectedStatus: UNAUTHORIZED,
      expectsClose: BOOLEAN_FALSE,
      headers: {},
      name: "should reject a request without a shutdown token",
      remoteAddress: LOOPBACK_HOST_V4,
    },
    {
      expectedAccepted: BOOLEAN_FALSE,
      expectedStatus: UNAUTHORIZED,
      expectsClose: BOOLEAN_FALSE,
      headers: { [SHUTDOWN_TOKEN]: COMMON_STRING },
      name: "should reject a request with the wrong shutdown token",
      remoteAddress: LOOPBACK_HOST_V4,
    },
    {
      expectedAccepted: BOOLEAN_FALSE,
      expectedStatus: UNAUTHORIZED,
      expectsClose: BOOLEAN_FALSE,
      headers: { [SHUTDOWN_TOKEN]: VALID_DEV_APP_ENV.shutdownToken },
      name: "should reject a valid token from a non-loopback address",
      remoteAddress: "203.0.113.1",
    },
    {
      expectedAccepted: BOOLEAN_TRUE,
      expectedStatus: ACCEPTED,
      expectsClose: BOOLEAN_TRUE,
      headers: { [SHUTDOWN_TOKEN]: VALID_DEV_APP_ENV.shutdownToken },
      name: "should accept a valid token from a loopback address",
      remoteAddress: LOOPBACK_HOST_V4,
    },
  ],
  SHUTDOWN_PATH: `/${SHUTDOWN}`,
} as const;

describe("shutdownRoute", (it) => {
  TEST_DATA.RESPONSE_CASES.forEach(
    ({
      expectedAccepted,
      expectedStatus,
      expectsClose,
      headers,
      name,
      remoteAddress,
    }) => {
      it(name, async ({ expect, onTestFinished }) => {
        const app = createTestApp(onTestFinished);
        const handle = { close: vi.fn(), uninstall: vi.fn() };

        await app.register(shutdownRoute, {
          handle: castAsType<ShutdownRouteOptions["handle"]>(handle),
        });
        await app.ready();

        const response = await app.inject({
          headers,
          method: "POST",
          remoteAddress,
          url: TEST_DATA.SHUTDOWN_PATH,
        });

        expect(response.statusCode).toBe(expectedStatus);
        expect(response.json()).toStrictEqual({
          accepted: expectedAccepted,
          timestamp: expect.any(String),
        });
        expect(handle.close).toHaveBeenCalledTimes(expectsClose ? 1 : 0);
      });
    },
  );
});
