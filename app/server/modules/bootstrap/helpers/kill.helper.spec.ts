import { VitestSetup } from "@configs/vitest/setup";
import { Buffer } from "node:buffer";
import { EventEmitter } from "node:events";
import type { OnTestFinishedHandler } from "vitest";
import { describe, vi } from "vitest";

import { ObjectHelper } from "@shared/helpers/object.helper";

import { KillHelper } from "./kill.helper";

const { mockSpawn } = vi.hoisted(() => ({
  mockSpawn: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  default: { spawn: mockSpawn },
  spawn: mockSpawn,
}));

const { createProcessScope, createTestApp, trackEndStateAfterEach } =
  VitestSetup();

const { run: runWithKill } = createProcessScope("kill");

trackEndStateAfterEach("kill.helper");

const { stripKeysInPlace } = ObjectHelper;

const { killPortOwner } = KillHelper;

const TEST_DATA = {
  KNOWN_PID: 12345,
  NON_WIN32_PLATFORM: "linux",
  PORT: 5173,
  SIGNAL: "SIGTERM",
  WIN32_PLATFORM: "win32",
  WINDOWS_FALLBACK_FRAGMENT: "Windows",
} as const;

const RESET_MOCK_ARRAY = [mockSpawn];

const createFakeChild = () => {
  return Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
  });
};

const stubPlatform = (
  value: NodeJS.Platform,
  onTestFinished: (fn: OnTestFinishedHandler) => void,
): void => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    process,
    "platform",
  );

  Object.defineProperty(process, "platform", {
    configurable: true,
    value,
  });

  onTestFinished(() => {
    if (originalDescriptor) {
      Object.defineProperty(process, "platform", originalDescriptor);
    }
  });
};

const buildListeningRow = (port: number, pid: number): string =>
  `  TCP    0.0.0.0:${port}           0.0.0.0:0              LISTENING       ${pid}`;

describe("KillHelper", () => {
  describe("killPortOwner", (it) => {
    it("should return unsupported-platform when not running on win32", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.NON_WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished);

      const result = await killPortOwner(
        TEST_DATA.PORT,
        TEST_DATA.SIGNAL,
        app.log,
      );

      expect(result).toEqual({ ok: false, reason: "unsupported-platform" });
    });

    it("should return no-pid when netstat exits with a non-zero code", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const fakeChild = createFakeChild();

      mockSpawn.mockReturnValueOnce(fakeChild);

      const resultPromise = killPortOwner(
        TEST_DATA.PORT,
        TEST_DATA.SIGNAL,
        app.log,
      );

      fakeChild.emit("close", 1);

      const result = await resultPromise;

      expect(result).toEqual({ ok: false, reason: "no-pid" });
    });

    it("should emit a non-zero exit warning carrying the exit code and port", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const warnSpy = vi.spyOn(app.log, "warn");
      const fakeChild = createFakeChild();
      const exitCode = 1;

      mockSpawn.mockReturnValueOnce(fakeChild);

      const resultPromise = killPortOwner(
        TEST_DATA.PORT,
        TEST_DATA.SIGNAL,
        app.log,
      );

      fakeChild.emit("close", exitCode);

      await resultPromise;

      expect(warnSpy).toHaveBeenNthCalledWith(
        warnSpy.mock.calls.length,
        { code: exitCode, port: TEST_DATA.PORT },
        "netstat exited non-zero.",
      );
    });

    it("should return no-pid when netstat emits a spawn error event", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const fakeChild = createFakeChild();

      mockSpawn.mockReturnValueOnce(fakeChild);

      const resultPromise = killPortOwner(
        TEST_DATA.PORT,
        TEST_DATA.SIGNAL,
        app.log,
      );

      fakeChild.emit("error", new Error("spawn ENOENT"));

      const result = await resultPromise;

      expect(result).toEqual({ ok: false, reason: "no-pid" });
    });

    it("should return no-pid when netstat output has no LISTENING row for the port", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const fakeChild = createFakeChild();

      mockSpawn.mockReturnValueOnce(fakeChild);

      const resultPromise = killPortOwner(
        TEST_DATA.PORT,
        TEST_DATA.SIGNAL,
        app.log,
      );

      fakeChild.stdout.emit(
        "data",
        Buffer.from("  TCP    0.0.0.0:9999    0.0.0.0:0    LISTENING    99\n"),
      );
      fakeChild.emit("close", 0);

      const result = await resultPromise;

      expect(result).toEqual({ ok: false, reason: "no-pid" });
    });

    it("should return ok when a matching LISTENING row is found and process.kill succeeds", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const fakeChild = createFakeChild();
      const kill = vi.fn<typeof process.kill>(() => true);
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });

      mockSpawn.mockReturnValueOnce(fakeChild);

      const result = await runWithKill(kill, async () => {
        const resultPromise = killPortOwner(
          TEST_DATA.PORT,
          TEST_DATA.SIGNAL,
          app.log,
        );

        fakeChild.stdout.emit(
          "data",
          Buffer.from(
            `${buildListeningRow(TEST_DATA.PORT, TEST_DATA.KNOWN_PID)}\n`,
          ),
        );
        fakeChild.emit("close", 0);

        return await resultPromise;
      });

      expect(result).toEqual({ ok: true });
      expect(kill).toHaveBeenNthCalledWith(
        kill.mock.calls.length,
        TEST_DATA.KNOWN_PID,
        TEST_DATA.SIGNAL,
      );
    });

    it("should fall back to the default Windows directory when SystemRoot is not set", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });
      const fakeChild = createFakeChild();

      mockSpawn.mockReturnValueOnce(fakeChild);

      const originalSystemRoot = process.env.SystemRoot;
      let resultPromise: Promise<unknown>;

      try {
        stripKeysInPlace(process.env, ["SystemRoot"]);
        resultPromise = killPortOwner(
          TEST_DATA.PORT,
          TEST_DATA.SIGNAL,
          app.log,
        );
      } finally {
        if (originalSystemRoot !== undefined) {
          process.env.SystemRoot = originalSystemRoot;
        }
      }

      fakeChild.emit("close", 1);

      await resultPromise;

      expect(mockSpawn.mock.calls).toContainEqual([
        expect.stringContaining(TEST_DATA.WINDOWS_FALLBACK_FRAGMENT),
        ["-ano"],
      ]);
    });

    it("should return kill-threw when process.kill throws on the resolved PID", async ({
      expect,
      onTestFinished,
    }) => {
      stubPlatform(TEST_DATA.WIN32_PLATFORM, onTestFinished);

      const fakeChild = createFakeChild();
      const kill = vi.fn<typeof process.kill>(() => {
        throw new Error("permission denied");
      });
      const app = createTestApp(onTestFinished, {
        mocksToReset: RESET_MOCK_ARRAY,
      });

      mockSpawn.mockReturnValueOnce(fakeChild);

      const result = await runWithKill(kill, async () => {
        const resultPromise = killPortOwner(
          TEST_DATA.PORT,
          TEST_DATA.SIGNAL,
          app.log,
        );

        fakeChild.stdout.emit(
          "data",
          Buffer.from(
            `${buildListeningRow(TEST_DATA.PORT, TEST_DATA.KNOWN_PID)}\n`,
          ),
        );
        fakeChild.emit("close", 0);

        return await resultPromise;
      });

      expect(result).toEqual({ ok: false, reason: "kill-threw" });
    });
  });
});
