import { VitestSetup } from "@configs/vitest/setup";
import { describe, vi } from "vitest";

import { ClaimPortHelper } from "./claim-port.helper";
import type * as KillHelper from "./kill.helper";
import type * as ListenHelper from "./listen.helper";
import type * as ShutdownRequestHelper from "./shutdown-request.helper";

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

vi.mock("./kill.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof KillHelper>();

  return {
    ...actual,
    KillHelper: Object.freeze({
      killPortOwner: mockKillPortOwner,
    }),
  };
});

vi.mock("./listen.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof ListenHelper>();

  return {
    ...actual,
    ListenHelper: Object.freeze({
      tryListen: mockTryListen,
      tryListenUntil: mockTryListenUntil,
    }),
  };
});

vi.mock("./shutdown-request.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof ShutdownRequestHelper>();

  return {
    ...actual,
    ShutdownRequestHelper: {
      requestCooperativeShutdown: mockRequestCooperativeShutdown,
    },
  };
});

const { createTestApp, trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("claim-port.helper");

const { claimPort } = ClaimPortHelper;

const TEST_DATA = {
  ESCALATION_CASES: [
    {
      name: "should escalate to kill when cooperative shutdown is accepted but the port stays bound",
      cooperative: true,
      expectedWarnMessage:
        "Cooperative shutdown accepted but port not released in time — escalating to signal.",
    },
    {
      name: "should escalate to kill when the cooperative shutdown request fails",
      cooperative: false,
      expectedWarnMessage:
        "Cooperative shutdown request failed — escalating to signal.",
    },
  ],
  KILL_REASON_CASES: [
    {
      name: "should log the unsupported-platform message and throw when force-kill is unsupported",
      reason: "unsupported-platform",
      expectedMessage:
        "Cooperative path exhausted and force-kill is unsupported on this platform — aborting.",
    },
    {
      name: "should log the no-pid message and throw when no listening process owns the port",
      reason: "no-pid",
      expectedMessage:
        "No listening process found owning port and port still in use — aborting.",
    },
    {
      name: "should log the kill-threw message and throw when the kill attempt throws",
      reason: "kill-threw",
      expectedMessage:
        "Failed to signal port owner and port still in use — aborting.",
    },
  ],
  PORT: 5173,
  SIGTERM: "SIGTERM",
  TOKEN: "test-token-value",
} as const;

const RESET_MOCK_ARRAY = [
  mockKillPortOwner,
  mockRequestCooperativeShutdown,
  mockTryListen,
  mockTryListenUntil,
];

describe("ClaimPortHelper", () => {
  describe("claimPort", (it) => {
    it("should resolve without warnings when the first listen succeeds", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const warnSpy = vi.spyOn(app.log, "warn");

      mockTryListen.mockResolvedValueOnce(true);

      await claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN });

      expect(warnSpy.mock.calls.length).toBe(0);
    });

    it("should resolve after a successful cooperative shutdown when the port frees", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const warnSpy = vi.spyOn(app.log, "warn");

      mockTryListen.mockResolvedValueOnce(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(true);
      mockTryListenUntil.mockResolvedValueOnce(true);

      await claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN });

      expect(warnSpy.mock.calls).toContainEqual([
        { port: TEST_DATA.PORT },
        "Port in use — requesting cooperative shutdown.",
      ]);
      expect(warnSpy.mock.calls.flat()).not.toContain(
        "Cooperative shutdown accepted but port not released in time — escalating to signal.",
      );
    });

    TEST_DATA.ESCALATION_CASES.forEach(
      ({ name, cooperative, expectedWarnMessage }) => {
        it(name, async ({ expect, onTestFinished }) => {
          const app = createTestApp(onTestFinished, {
            mocksToReset: RESET_MOCK_ARRAY,
          });
          const warnSpy = vi.spyOn(app.log, "warn");

          mockTryListen.mockResolvedValueOnce(false);
          mockRequestCooperativeShutdown.mockResolvedValueOnce(cooperative);

          if (cooperative) {
            mockTryListenUntil.mockResolvedValueOnce(false);
          }

          mockKillPortOwner.mockResolvedValueOnce({ ok: true });
          mockTryListenUntil.mockResolvedValueOnce(true);

          await claimPort({
            app,
            port: TEST_DATA.PORT,
            token: TEST_DATA.TOKEN,
          });

          expect(warnSpy.mock.calls).toContainEqual([
            {
              port: TEST_DATA.PORT,
              signal: TEST_DATA.SIGTERM,
              timeoutMs: cooperative ? expect.any(Number) : undefined,
            },
            expectedWarnMessage,
          ]);
        });
      },
    );

    it("should resolve when the port frees between cooperative wait and the post-kill recovery listen", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });

      mockTryListen.mockResolvedValueOnce(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(false);
      mockKillPortOwner.mockResolvedValueOnce({
        ok: false,
        reason: "no-pid",
      });
      mockTryListen.mockResolvedValueOnce(true);

      await expect(
        claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
      ).resolves.toBeUndefined();
    });

    TEST_DATA.KILL_REASON_CASES.forEach(({ name, reason, expectedMessage }) => {
      it(name, async ({ expect, onTestFinished }) => {
        const app = createTestApp(onTestFinished, {
          mocksToReset: RESET_MOCK_ARRAY,
        });
        const errorSpy = vi.spyOn(app.log, "error");

        mockTryListen.mockResolvedValue(false);
        mockRequestCooperativeShutdown.mockResolvedValueOnce(false);
        mockKillPortOwner.mockResolvedValueOnce({ ok: false, reason });

        await expect(
          claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
        ).rejects.toThrow(expectedMessage);

        expect(errorSpy.mock.calls).toContainEqual([
          { port: TEST_DATA.PORT },
          expectedMessage,
        ]);
      });
    });

    it("should log the unknown-reason fallback message and throw when the kill returns a reason outside the documented union", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const errorSpy = vi.spyOn(app.log, "error");
      const unknownReason = "unknown-future-reason";

      mockTryListen.mockResolvedValue(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(false);
      mockKillPortOwner.mockResolvedValueOnce({
        ok: false,
        reason: unknownReason,
      });

      await expect(
        claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
      ).rejects.toThrow(`Unknown kill failure reason: ${unknownReason}`);

      expect(errorSpy.mock.calls).toContainEqual([
        { port: TEST_DATA.PORT, reason: unknownReason },
        "Unknown kill failure reason — aborting.",
      ]);
    });

    it("should log the port-still-in-use message and throw when listen does not succeed after the kill signal", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const errorSpy = vi.spyOn(app.log, "error");

      mockTryListen.mockResolvedValueOnce(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(false);
      mockKillPortOwner.mockResolvedValueOnce({ ok: true });
      mockTryListenUntil.mockResolvedValueOnce(false);

      await expect(
        claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
      ).rejects.toThrow("Port still in use after signal");

      expect(errorSpy.mock.calls).toContainEqual([
        { port: TEST_DATA.PORT },
        "Port still in use after signal — aborting.",
      ]);
    });

    it("should abort without force-killing when the cooperative retry is accepted by a sibling new instance", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const errorSpy = vi.spyOn(app.log, "error");
      const siblingMessage =
        "Cooperative shutdown accepted by a sibling new instance — aborting to avoid stomping the handover winner.";

      mockTryListen.mockResolvedValueOnce(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(true);
      mockTryListenUntil.mockResolvedValueOnce(false);
      mockRequestCooperativeShutdown.mockResolvedValueOnce(true);

      await expect(
        claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
      ).rejects.toThrow(siblingMessage);

      expect(mockKillPortOwner.mock.calls.length).toBe(0);
      expect(errorSpy.mock.calls).toContainEqual([
        { port: TEST_DATA.PORT },
        siblingMessage,
      ]);
    });

    it("should propagate unexpected listen errors unchanged so the composition layer can fail-fast", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const unexpected = new Error("permission denied");

      mockTryListen.mockRejectedValueOnce(unexpected);

      await expect(
        claimPort({ app, port: TEST_DATA.PORT, token: TEST_DATA.TOKEN }),
      ).rejects.toBe(unexpected);
    });
  });
});
