import { VitestSetup } from "@configs/vitest/setup";
import { describe, vi } from "vitest";

import { ListenHelper } from "./listen.helper";

const { createTestApp, trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("listen.helper");

const { tryListen, tryListenUntil } = ListenHelper;

const TEST_DATA = {
  BIND_ALL_IPV4: "0.0.0.0",
  EADDRINUSE_CODE: "EADDRINUSE",
  EPHEMERAL_PORT: 0,
  NON_EADDRINUSE_CODE: "EACCES",
  POLL_TIMEOUT_BUDGET_MS: 1000,
  PORT: 5173,
  SUB_INTERVAL_TIMEOUT_MS: 50,
} as const;

const createErrnoException = (code: string) => {
  const error = new Error(`mock listen error: ${code}`);

  Reflect.set(error, "code", code);

  return error;
};

describe("ListenHelper", () => {
  describe("tryListen", (it) => {
    it("should resolve to true when listen succeeds", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockResolvedValueOnce(undefined);

      const result = await tryListen(app, TEST_DATA.EPHEMERAL_PORT);

      expect(result).toBe(true);
    });

    it("should resolve to false when listen rejects with EADDRINUSE", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockRejectedValue(
        createErrnoException(TEST_DATA.EADDRINUSE_CODE),
      );

      const result = await tryListen(app, TEST_DATA.PORT);

      expect(result).toBe(false);
    });

    it("should rethrow errno exceptions whose code is not EADDRINUSE", async ({
      expect,
      onTestFinished,
    }) => {
      const error = createErrnoException(TEST_DATA.NON_EADDRINUSE_CODE);
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockRejectedValue(error);

      await expect(tryListen(app, TEST_DATA.PORT)).rejects.toBe(error);
    });

    it("should rethrow errors that are not errno exceptions", async ({
      expect,
      onTestFinished,
    }) => {
      const error = new Error("not an errno");
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockRejectedValue(error);

      await expect(tryListen(app, TEST_DATA.PORT)).rejects.toBe(error);
    });

    it("should call app.listen with the configured bind-all IPv4 host", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);
      const listenSpy = vi
        .spyOn(app, "listen")
        .mockResolvedValueOnce(undefined);

      await tryListen(app, TEST_DATA.EPHEMERAL_PORT);

      expect(listenSpy).toHaveBeenNthCalledWith(
        listenSpy.mock.calls.length,
        expect.objectContaining({
          host: TEST_DATA.BIND_ALL_IPV4,
          port: TEST_DATA.EPHEMERAL_PORT,
        }),
      );
    });
  });

  describe("tryListenUntil", (it) => {
    it("should resolve to true when the first attempt succeeds", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockResolvedValueOnce(undefined);

      const result = await tryListenUntil(
        app,
        TEST_DATA.EPHEMERAL_PORT,
        TEST_DATA.POLL_TIMEOUT_BUDGET_MS,
      );

      expect(result).toBe(true);
    });

    it("should resolve to true when listen succeeds after some retries", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);
      const listenSpy = vi
        .spyOn(app, "listen")
        .mockRejectedValueOnce(createErrnoException(TEST_DATA.EADDRINUSE_CODE))
        .mockRejectedValueOnce(createErrnoException(TEST_DATA.EADDRINUSE_CODE))
        .mockResolvedValueOnce(undefined);
      const callsBefore = listenSpy.mock.calls.length;

      const result = await tryListenUntil(
        app,
        TEST_DATA.EPHEMERAL_PORT,
        TEST_DATA.POLL_TIMEOUT_BUDGET_MS,
      );

      expect(result).toBe(true);
      expect(listenSpy.mock.calls.length).toBe(callsBefore + 3);
    });

    it("should resolve to false when listen keeps rejecting until the timeout expires", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      vi.spyOn(app, "listen").mockRejectedValue(
        createErrnoException(TEST_DATA.EADDRINUSE_CODE),
      );

      const result = await tryListenUntil(
        app,
        TEST_DATA.PORT,
        TEST_DATA.SUB_INTERVAL_TIMEOUT_MS,
      );

      expect(result).toBe(false);
    });
  });
});
