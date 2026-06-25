import type { AxiosResponse } from "axios";
import axios from "axios";
import { beforeAll, describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { API_INTERNAL_ENDPOINTS } from "@server/constants/endpoints.constant";
import { HEADERS } from "@server/constants/headers.constant";
import { HOSTS } from "@server/constants/hosts.constant";
import type { AppInstance } from "@server/types/instance.type";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { CooperativeShutdownHelper } from "./cooperative-shutdown.helper";

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}));

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    MAX_PORT,
    MIN_PORT,
    NUMBER_1,
    VALID_DEV_APP_ENV,
    VALID_PORT,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("cooperative-shutdown.helper");

const { castAsType } = TypeHelper;

const { SHUTDOWN } = API_INTERNAL_ENDPOINTS;
const { API_INTERNAL } = BASE_URLS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { HTTP } = HTTP_SCHEMES;

const { requestCooperativeShutdown } = CooperativeShutdownHelper;

const mockAxiosPost = vi.mocked(axios.post);

const makeInstance = (port: number): AppInstance =>
  castAsType<AppInstance>({
    appEnv: { port, shutdownToken: VALID_DEV_APP_ENV.shutdownToken },
    log: { warn: () => undefined },
  });

const TEST_DATA = {
  CONNECTION_REFUSED: new Error("connection refused"),
  REQUEST_CASES: [
    {
      expected: BOOLEAN_TRUE,
      name: "should resolve true when the shutdown request succeeds",
      port: VALID_PORT,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should resolve false when the shutdown request fails",
      port: VALID_PORT + NUMBER_1,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should reject a port below the valid range",
      port: MIN_PORT - NUMBER_1,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should reject a port above the valid range",
      port: MAX_PORT + NUMBER_1,
    },
  ],
  URL: `${HTTP}://${LOOPBACK_HOST_V4}:${VALID_PORT}${API_INTERNAL}/${SHUTDOWN}`,
} as const;

describe("CooperativeShutdownHelper", () => {
  beforeAll(() => {
    mockAxiosPost.mockImplementation(async (url) => {
      if (castAsType<string>(url).includes(`:${VALID_PORT + NUMBER_1}`)) {
        throw TEST_DATA.CONNECTION_REFUSED;
      }

      return castAsType<AxiosResponse>({});
    });
  });

  describe("requestCooperativeShutdown", (it) => {
    TEST_DATA.REQUEST_CASES.forEach(({ expected, name, port }) => {
      it(name, async ({ expect }) => {
        expect(await requestCooperativeShutdown(makeInstance(port))).toBe(
          expected,
        );
      });
    });

    it("should post to the loopback shutdown url with the token header", async ({
      expect,
    }) => {
      await requestCooperativeShutdown(makeInstance(VALID_PORT));

      expect(mockAxiosPost).toHaveBeenCalledWith(
        TEST_DATA.URL,
        {},
        expect.objectContaining({
          headers: { [SHUTDOWN_TOKEN]: VALID_DEV_APP_ENV.shutdownToken },
        }),
      );
    });
  });
});
