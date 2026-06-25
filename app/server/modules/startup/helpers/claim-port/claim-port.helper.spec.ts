import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { SIGNALS } from "@server/constants/signals.constant";
import { KILL_FAILURE_MESSAGES } from "@server/modules/startup/constants/messages.constant";
import { TIMING_IN_MS } from "@server/modules/startup/constants/timing.constant";
import type { KillPortOwnerResult } from "@server/modules/startup/types/kill.type";
import type { AppInstance } from "@server/types/instance.type";

import { MapHelper } from "@shared/helpers/map.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

import { ClaimPortHelper } from "./claim-port.helper";

const {
  mockKillPortOwner,
  mockRequestCooperativeShutdown,
  mockTryListen,
  mockTryListenUntil,
} = vi.hoisted(() => ({
  mockKillPortOwner: vi.fn(),
  mockRequestCooperativeShutdown: vi.fn(),
  mockTryListen: vi.fn(),
  mockTryListenUntil: vi.fn(),
}));

vi.mock("./helpers/cooperative-shutdown.helper", () => ({
  CooperativeShutdownHelper: {
    requestCooperativeShutdown: mockRequestCooperativeShutdown,
  },
}));

vi.mock("./helpers/kill.helper", () => ({
  KillHelper: { killPortOwner: mockKillPortOwner },
}));

vi.mock("./helpers/listen.helper", () => ({
  ListenHelper: {
    tryListen: mockTryListen,
    tryListenUntil: mockTryListenUntil,
  },
}));

const {
  createMockInstance,
  sharedTestData: { BOOLEAN_FALSE, BOOLEAN_TRUE },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("claim-port.helper");

const { SIGTERM } = SIGNALS;
const { COOPERATIVE_HANDOVER_TIMEOUT } = TIMING_IN_MS;

const { getMapValue } = MapHelper;
const { castAsType } = TypeHelper;

const { claimPort } = ClaimPortHelper;

const { makeInstance, scenarioOf, ...TEST_DATA } = {
  FORCE_KILLED: { ok: BOOLEAN_TRUE },
  NO_PID: { ok: BOOLEAN_FALSE, reason: "no-pid" },
  SCENARIO_KEY: "__claimPortScenario",
  SIBLING_ABORT_MESSAGE:
    "Cooperative shutdown accepted by a sibling new instance — aborting to avoid stomping the handover winner.",
  get SIGNAL_SCENARIO() {
    return {
      killPortOwner: this.NO_PID,
      requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_FALSE],
      tryListen: [BOOLEAN_FALSE, BOOLEAN_FALSE],
      tryListenUntil: { cooperative: BOOLEAN_FALSE },
    };
  },
  get ABORT_CASES() {
    return [
      {
        name: "should abort when a sibling wins the cooperative handover",
        rejectsWith: this.SIBLING_ABORT_MESSAGE,
        scenario: {
          requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_TRUE],
          tryListen: [BOOLEAN_FALSE],
          tryListenUntil: { cooperative: BOOLEAN_FALSE },
        },
      },
      {
        name: "should abort when a sibling claims the port after a refused cooperative shutdown",
        rejectsWith: this.SIBLING_ABORT_MESSAGE,
        scenario: {
          requestCooperativeShutdown: [BOOLEAN_FALSE, BOOLEAN_TRUE],
          tryListen: [BOOLEAN_FALSE],
          tryListenUntil: {},
        },
      },
      {
        name: "should abort with the kill-failure reason when the port stays in use after a failed force-kill",
        rejectsWith: getMapValue(KILL_FAILURE_MESSAGES, "no-pid", ""),
        scenario: {
          killPortOwner: this.NO_PID,
          requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_FALSE],
          tryListen: [BOOLEAN_FALSE, BOOLEAN_FALSE],
          tryListenUntil: { cooperative: BOOLEAN_FALSE },
        },
      },
      {
        name: "should abort when the port is still in use after the signal",
        rejectsWith: "Port still in use after signal — aborting.",
        scenario: {
          killPortOwner: this.FORCE_KILLED,
          requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_FALSE],
          tryListen: [BOOLEAN_FALSE],
          tryListenUntil: { cooperative: BOOLEAN_FALSE, force: BOOLEAN_FALSE },
        },
      },
    ];
  },
  get RESOLVE_CASES() {
    return [
      {
        name: "should return when the port binds on the first attempt",
        scenario: {
          requestCooperativeShutdown: [],
          tryListen: [BOOLEAN_TRUE],
          tryListenUntil: {},
        },
      },
      {
        name: "should return when cooperative shutdown frees the port within the handover window",
        scenario: {
          requestCooperativeShutdown: [BOOLEAN_TRUE],
          tryListen: [BOOLEAN_FALSE],
          tryListenUntil: { cooperative: BOOLEAN_TRUE },
        },
      },
      {
        name: "should return when a failed force-kill still leaves the port free on retry",
        scenario: {
          killPortOwner: this.NO_PID,
          requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_FALSE],
          tryListen: [BOOLEAN_FALSE, BOOLEAN_TRUE],
          tryListenUntil: { cooperative: BOOLEAN_FALSE },
        },
      },
      {
        name: "should return after reclaiming the port once the signal is sent",
        scenario: {
          killPortOwner: this.FORCE_KILLED,
          requestCooperativeShutdown: [BOOLEAN_TRUE, BOOLEAN_FALSE],
          tryListen: [BOOLEAN_FALSE],
          tryListenUntil: { cooperative: BOOLEAN_FALSE, force: BOOLEAN_TRUE },
        },
      },
    ];
  },
  get makeInstance() {
    return (scenario: {
      killPortOwner?: KillPortOwnerResult;
      requestCooperativeShutdown: ReadonlyArray<boolean>;
      tryListen: ReadonlyArray<boolean>;
      tryListenUntil: { cooperative?: boolean; force?: boolean };
    }): AppInstance => {
      const instance = createMockInstance();

      Reflect.set(instance, this.SCENARIO_KEY, {
        killPortOwner: scenario.killPortOwner,
        requestCooperativeShutdown: [...scenario.requestCooperativeShutdown],
        tryListen: [...scenario.tryListen],
        tryListenUntil: { ...scenario.tryListenUntil },
      });

      return instance;
    };
  },
  get scenarioOf() {
    return (instance: AppInstance) =>
      castAsType<{
        killPortOwner: KillPortOwnerResult | undefined;
        requestCooperativeShutdown: Array<boolean>;
        tryListen: Array<boolean>;
        tryListenUntil: { cooperative?: boolean; force?: boolean };
      }>(Reflect.get(instance, this.SCENARIO_KEY));
  },
} as const;

describe("ClaimPortHelper", () => {
  describe("claimPort", (it) => {
    const { beforeAll, afterAll } = it;

    beforeAll(() => {
      mockTryListen.mockImplementation((instance: AppInstance) =>
        Promise.resolve(
          scenarioOf(instance).tryListen.shift() ?? BOOLEAN_FALSE,
        ),
      );

      mockRequestCooperativeShutdown.mockImplementation(
        (instance: AppInstance) =>
          Promise.resolve(
            scenarioOf(instance).requestCooperativeShutdown.shift() ??
              BOOLEAN_FALSE,
          ),
      );

      mockTryListenUntil.mockImplementation(
        (instance: AppInstance, timeout: number) =>
          Promise.resolve(
            timeout === COOPERATIVE_HANDOVER_TIMEOUT
              ? (scenarioOf(instance).tryListenUntil.cooperative ??
                  BOOLEAN_FALSE)
              : (scenarioOf(instance).tryListenUntil.force ??
                  BOOLEAN_FALSE),
          ),
      );

      mockKillPortOwner.mockImplementation((instance: AppInstance) =>
        Promise.resolve(
          scenarioOf(instance).killPortOwner ?? TEST_DATA.NO_PID,
        ),
      );
    });

    afterAll(() => {
      mockKillPortOwner.mockReset();
      mockRequestCooperativeShutdown.mockReset();
      mockTryListen.mockReset();
      mockTryListenUntil.mockReset();
    });

    TEST_DATA.RESOLVE_CASES.forEach(({ name, scenario }) => {
      it(name, async ({ expect }) => {
        await expect(
          claimPort(makeInstance(scenario)),
        ).resolves.toBeUndefined();
      });
    });

    TEST_DATA.ABORT_CASES.forEach(({ name, rejectsWith, scenario }) => {
      it(name, async ({ expect }) => {
        await expect(
          claimPort(makeInstance(scenario)),
        ).rejects.toThrow(rejectsWith);
      });
    });

    it("should signal the port owner with SIGTERM", async ({ expect }) => {
      const instance = makeInstance(TEST_DATA.SIGNAL_SCENARIO);

      await expect(claimPort(instance)).rejects.toThrow();

      const calls = mockKillPortOwner.mock.calls.filter(
        ([calledWith]) => calledWith === instance,
      );

      expect(calls).toStrictEqual([[instance, SIGTERM]]);
    });
  });
});
