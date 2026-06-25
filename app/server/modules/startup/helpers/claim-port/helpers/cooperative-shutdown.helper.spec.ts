import type { AxiosResponse } from "axios";
import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import { API_INTERNAL_ENDPOINTS } from "@server/constants/endpoints.constant";
import { HEADERS } from "@server/constants/headers.constant";
import { HOSTS } from "@server/constants/hosts.constant";

import { HTTP_SCHEMES } from "@shared/constants/http.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { Port } from "@shared/types/app-env.type";

import { CooperativeShutdownHelper } from "./cooperative-shutdown.helper";

const {
  createMockInstance,
  sharedMock: { mockAxiosPost },
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    EMPTY_OBJECT,
    MAX_PORT,
    MIN_PORT,
    NUMBER_1,
    VALID_DEV_APP_ENV,
    VALID_PORT,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("cooperative-shutdown.helper");

const { SHUTDOWN } = API_INTERNAL_ENDPOINTS;
const { API_INTERNAL } = BASE_URLS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOST_V4 } = HOSTS;
const { HTTP } = HTTP_SCHEMES;

const { castAsType } = TypeHelper;

const { requestCooperativeShutdown } = CooperativeShutdownHelper;

const { respondToPost, ...TEST_DATA } = {
  CONNECTION_REFUSED: new Error("connection refused"),
  REQUEST_CASES: castAsType<
    Array<{
      expected: boolean;
      name: string;
      port: Port;
    }>
  >([
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
  ]),
  URL: `${HTTP}://${LOOPBACK_HOST_V4}:${VALID_PORT}${API_INTERNAL}/${SHUTDOWN}`,
  get respondToPost() {
    return async (url: string) => {
      if (url.includes(`:${VALID_PORT + NUMBER_1}`)) {
        throw TEST_DATA.CONNECTION_REFUSED;
      }

      return castAsType<AxiosResponse>({});
    };
  },
} as const;

describe("CooperativeShutdownHelper", () => {
  describe("requestCooperativeShutdown", (it) => {
    const { beforeAll, afterAll } = it;

    beforeAll(() => {
      mockAxiosPost.mockImplementation(respondToPost);
    });

    afterAll(() => {
      mockAxiosPost.mockReset();
    });

    TEST_DATA.REQUEST_CASES.forEach(({ expected, name, port }) => {
      it(name, async ({ expect }) => {
        expect(
          await requestCooperativeShutdown(
            createMockInstance({ appEnv: { port } }),
          ),
        ).toBe(expected);
      });
    });

    it("should post to the loopback shutdown url with the token header and resolve true", async ({
      expect,
    }) => {
      const result = await requestCooperativeShutdown(
        createMockInstance({ appEnv: { port: castAsType<Port>(VALID_PORT) } }),
      );

      expect(mockAxiosPost).toHaveBeenCalledWith(
        TEST_DATA.URL,
        EMPTY_OBJECT,
        expect.objectContaining({
          headers: { [SHUTDOWN_TOKEN]: VALID_DEV_APP_ENV.shutdownToken },
        }),
      );
      expect(result).toBe(BOOLEAN_TRUE);
    });
  });
});
