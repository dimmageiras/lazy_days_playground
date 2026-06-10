import axios from "axios";
import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";
import { TypesHelper } from "@shared/helpers/types.helper";

import { ENDPOINTS } from "../constants/endpoints.constant";
import { HEADERS } from "../constants/headers.constant";
import { ShutdownHelper } from "./shutdown.helper";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("shutdown.helper");

const { castAsType } = TypesHelper;

const { API_INTERNAL } = BASE_URLS;
const { HTTP } = HTTP_SCHEMES;
const { SHUTDOWN } = ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;

const { requestCooperativeShutdown } = ShutdownHelper;

const postMock = vi.mocked(axios.post);

const TEST_DATA = {
  BIND_ALL_IPV4: "0.0.0.0",
  FAIL_PORT: 59102,
  SUCCESS_PORT: 59101,
  TOKEN: "fake-shutdown-token",
} as const;

postMock.mockImplementation((url) =>
  typeof url === "string" && url.includes(`:${TEST_DATA.FAIL_PORT}/`)
    ? Promise.reject(new Error("connection refused"))
    : Promise.resolve({ status: 202 }),
);

const buildInstance = (port: number): AppInstance =>
  castAsType<AppInstance>({
    appEnv: {
      bindAllIpv4: TEST_DATA.BIND_ALL_IPV4,
      port,
      shutdownToken: TEST_DATA.TOKEN,
    },
    log: { warn: vi.fn() },
  });

describe("ShutdownHelper", () => {
  describe("requestCooperativeShutdown", (it) => {
    it("should POST an empty body to the bind-all URL with the token in the config headers", async ({
      expect,
    }) => {
      const { BIND_ALL_IPV4, SUCCESS_PORT, TOKEN } = TEST_DATA;

      const result = await requestCooperativeShutdown(
        buildInstance(SUCCESS_PORT),
      );

      expect(result).toBe(true);

      const expectedUrl = `${HTTP}://${BIND_ALL_IPV4}:${SUCCESS_PORT}${API_INTERNAL}/${SHUTDOWN}`;

      expect(postMock).toHaveBeenCalledWith(
        expectedUrl,
        {},
        expect.objectContaining({
          headers: { [SHUTDOWN_TOKEN]: TOKEN },
        }),
      );
    });

    it("should return false and warn when the request fails", async ({
      expect,
    }) => {
      const instance = buildInstance(TEST_DATA.FAIL_PORT);

      const result = await requestCooperativeShutdown(instance);

      expect(result).toBe(false);
      expect(instance.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({ port: TEST_DATA.FAIL_PORT }),
        "🚧 Cooperative shutdown request failed.",
      );
    });
  });
});
