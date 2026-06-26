import type { MockInstance } from "vitest";
import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { KillFailureReason } from "@server/modules/startup/types/kill.type";

import { TypeHelper } from "@shared/helpers/type.helper";
import type { Port } from "@shared/types/app-env.type";

import { KillHelper } from "./kill.helper";

const {
  createMockInstance,
  sharedMock: { mockPortToPid },
  sharedTestData: { BOOLEAN_FALSE, BOOLEAN_TRUE, NAN_VALUE, VALID_PORT },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("kill.helper");

const { castAsType } = TypeHelper;

const { killPortOwner } = KillHelper;

const { lookupPort, ...TEST_DATA } = {
  FOREIGN_PID: Math.max(process.pid, process.ppid) + 1,
  KILL_FAILED: new Error("kill failed"),
  KILL_THROW_PID: Math.max(process.pid, process.ppid) + 2,
  LOOKUP_FAILED: new Error("lookup failed"),
  NO_PID: "no-pid",
  PORT_KILL_THREW: castAsType<Port>(VALID_PORT + 1),
  PORT_LOOKUP_THREW: castAsType<Port>(VALID_PORT + 4),
  PORT_NAN_PID: castAsType<Port>(VALID_PORT + 2),
  PORT_NEGATIVE_PID: castAsType<Port>(VALID_PORT + 3),
  PORT_OK: castAsType<Port>(VALID_PORT),
  PORT_SELF_PID: castAsType<Port>(VALID_PORT + 5),
  PORT_SELF_PPID: castAsType<Port>(VALID_PORT + 6),
  SELF_PID: "self-pid",
  SIGTERM: "SIGTERM",
  get FAILURE_CASES() {
    return castAsType<
      Array<{ name: string; port: Port; reason: KillFailureReason }>
    >([
      {
        name: "should fail with self-pid when the owner is this process",
        port: this.PORT_SELF_PID,
        reason: this.SELF_PID,
      },
      {
        name: "should fail with self-pid when the owner is the parent process",
        port: this.PORT_SELF_PPID,
        reason: this.SELF_PID,
      },
      {
        name: "should fail with no-pid when the lookup yields a non-integer pid",
        port: this.PORT_NAN_PID,
        reason: this.NO_PID,
      },
      {
        name: "should fail with no-pid when the lookup yields a pid below one",
        port: this.PORT_NEGATIVE_PID,
        reason: this.NO_PID,
      },
      {
        name: "should fail with no-pid when the lookup throws",
        port: this.PORT_LOOKUP_THREW,
        reason: this.NO_PID,
      },
      {
        name: "should fail with kill-threw when signalling the owner throws",
        port: this.PORT_KILL_THREW,
        reason: "kill-threw",
      },
    ]);
  },
  get lookupPort() {
    return async (port: Port): Promise<number> => {
      if (port === this.PORT_LOOKUP_THREW) {
        throw this.LOOKUP_FAILED;
      }

      return (
        new Map<Port, number>([
          [this.PORT_OK, this.FOREIGN_PID],
          [this.PORT_KILL_THREW, this.KILL_THROW_PID],
          [this.PORT_NAN_PID, NAN_VALUE],
          [this.PORT_NEGATIVE_PID, -1],
          [this.PORT_SELF_PID, process.pid],
          [this.PORT_SELF_PPID, process.ppid],
        ]).get(port) ?? NAN_VALUE
      );
    };
  },
} as const;

describe("KillHelper", () => {
  describe("killPortOwner", (it) => {
    const { beforeAll, afterAll } = it;

    let killSpy: MockInstance<typeof process.kill>;

    beforeAll(() => {
      mockPortToPid.mockImplementation(lookupPort);

      killSpy = vi
        .spyOn(process, "kill")
        .mockImplementation((pid: number): true => {
          if (pid === TEST_DATA.KILL_THROW_PID) {
            throw TEST_DATA.KILL_FAILED;
          }

          return true;
        });
    });

    afterAll(() => {
      mockPortToPid.mockReset();
      killSpy.mockRestore();
    });

    it("should signal the foreign port owner with the given signal and resolve ok", async ({
      expect,
    }) => {
      const result = await killPortOwner(
        createMockInstance({ appEnv: { port: TEST_DATA.PORT_OK } }),
        TEST_DATA.SIGTERM,
      );

      const killCalls = killSpy.mock.calls.filter(
        ([pid]) => pid === TEST_DATA.FOREIGN_PID,
      );

      expect(killCalls).toHaveLength(1);
      expect(killCalls[0]).toStrictEqual([
        TEST_DATA.FOREIGN_PID,
        TEST_DATA.SIGTERM,
      ]);
      expect(result).toStrictEqual({ ok: BOOLEAN_TRUE });
    });

    it("should never signal this process when it owns the port", async ({
      expect,
    }) => {
      const result = await killPortOwner(
        createMockInstance({ appEnv: { port: TEST_DATA.PORT_SELF_PID } }),
        TEST_DATA.SIGTERM,
      );

      expect(result).toStrictEqual({
        ok: BOOLEAN_FALSE,
        reason: TEST_DATA.SELF_PID,
      });
    });

    TEST_DATA.FAILURE_CASES.forEach(({ name, port, reason }) => {
      it(name, async ({ expect }) => {
        const result = await killPortOwner(
          createMockInstance({ appEnv: { port } }),
          TEST_DATA.SIGTERM,
        );

        expect(result).toStrictEqual({ ok: BOOLEAN_FALSE, reason });
      });
    });
  });
});
