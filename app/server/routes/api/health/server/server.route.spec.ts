import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { API_HEALTH_ENDPOINTS } from "@server/constants/endpoints.constant";

import { HTTP_STATUS } from "@shared/constants/http.constant";

import { serverRoute } from "./server.route";

const {
  createTestApp,
  sharedTestData: { VALID_DEV_APP_ENV },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("server.route");

const { SERVER } = API_HEALTH_ENDPOINTS;
const { OK } = HTTP_STATUS;

const TEST_DATA = {
  SERVER_PATH: `/${SERVER}`,
} as const;

describe("serverRoute", (it) => {
  it("should report the service name and an ISO timestamp", async ({
    expect,
    onTestFinished,
  }) => {
    const app = createTestApp(onTestFinished);

    app.decorate("appEnv", VALID_DEV_APP_ENV);

    await app.register(serverRoute);
    await app.ready();

    const response = await app.inject({
      method: "GET",
      url: TEST_DATA.SERVER_PATH,
    });

    expect(response.statusCode).toBe(OK);
    expect(response.json()).toStrictEqual({
      service: VALID_DEV_APP_ENV.serviceName,
      timestamp: expect.any(String),
    });
  });
});
