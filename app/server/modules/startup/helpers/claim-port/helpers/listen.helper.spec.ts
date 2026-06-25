import type { Mock } from "vitest";
import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TIMING_IN_MS } from "@server/modules/startup/constants/timing.constant";
import type { AppInstance } from "@server/types/instance.type";

import { TypeHelper } from "@shared/helpers/type.helper";

import { ListenHelper } from "./listen.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_BIND_ALL_IPV4,
    UNDEFINED_VALUE,
    VALID_PORT,
  },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("listen.helper");

const { LISTEN_POLL_INITIAL_INTERVAL } = TIMING_IN_MS;

const { castAsType } = TypeHelper;

const { tryListen, tryListenUntil } = ListenHelper;

const TEST_DATA = {
  TRY_LISTEN_CASES: [
    {
      expected: BOOLEAN_TRUE,
      name: "should resolve true when the port binds",
      rejection: UNDEFINED_VALUE,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should resolve false when the address is already in use",
      rejection: Object.assign(new Error("address already in use"), {
        code: "EADDRINUSE",
      }),
    },
  ],
  TRY_LISTEN_UNTIL_CASES: [
    {
      expected: BOOLEAN_TRUE,
      name: "should resolve true as soon as the port binds",
      rejection: UNDEFINED_VALUE,
      timeout: LISTEN_POLL_INITIAL_INTERVAL,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should resolve false when the port never frees before the timeout",
      rejection: Object.assign(new Error("address already in use"), {
        code: "EADDRINUSE",
      }),
      timeout: 1,
    },
  ],
  UNEXPECTED_ERROR: new Error("an unexpected bind error"),
  get makeInstance() {
    return (listen: Mock): AppInstance =>
      castAsType<AppInstance>({
        appEnv: { bindAllIpv4: COMMON_BIND_ALL_IPV4, port: VALID_PORT },
        listen,
        log: { error: () => UNDEFINED_VALUE },
      });
  },
  get makeListen() {
    return (rejection: unknown): Mock =>
      rejection === UNDEFINED_VALUE
        ? vi.fn().mockResolvedValue(COMMON_BIND_ALL_IPV4)
        : vi.fn().mockRejectedValue(rejection);
  },
} as const;

describe("ListenHelper", () => {
  describe("tryListen", (it) => {
    TEST_DATA.TRY_LISTEN_CASES.forEach(({ expected, name, rejection }) => {
      it(name, async ({ expect }) => {
        const instance = TEST_DATA.makeInstance(
          TEST_DATA.makeListen(rejection),
        );

        expect(await tryListen(instance)).toBe(expected);
      });
    });

    it("should rethrow an unexpected bind error", async ({ expect }) => {
      const instance = TEST_DATA.makeInstance(
        TEST_DATA.makeListen(TEST_DATA.UNEXPECTED_ERROR),
      );

      await expect(tryListen(instance)).rejects.toBe(
        TEST_DATA.UNEXPECTED_ERROR,
      );
    });
  });

  describe("tryListenUntil", (it) => {
    TEST_DATA.TRY_LISTEN_UNTIL_CASES.forEach(
      ({ expected, name, rejection, timeout }) => {
        it(name, async ({ expect }) => {
          const instance = TEST_DATA.makeInstance(
            TEST_DATA.makeListen(rejection),
          );

          expect(await tryListenUntil(instance, timeout)).toBe(expected);
        });
      },
    );
  });
});
