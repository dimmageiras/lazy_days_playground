import { VitestSetup } from "@configs/vitest/setup";
import type { CloseWithGraceAsyncCallback, Signals } from "close-with-grace";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import { describe, vi } from "vitest";

import { TypesHelper } from "@shared/helpers/types.helper";

import { CloseHelper } from "./close.helper";

const {
  createGlobalThisScope,
  createTestApp,
  mockCloseWithGrace,
  trackEndStateAfterEach,
} = VitestSetup();

const { run: runWithPriorInstance } = createGlobalThisScope("__priorInstance");

trackEndStateAfterEach("close.helper");

const { castAsType } = TypesHelper;

const { setupCloseListeners } = CloseHelper;

const TEST_DATA = {
  KNOWN_SIGNAL_CASES: [
    {
      name: "should log the mapped SIGTERM message and close the app when the callback is fired with SIGTERM",
      signal: "SIGTERM",
      expectedMessage:
        "Termination requested (SIGTERM). Shutting down gracefully.",
    },
    {
      name: "should log the mapped SIGINT message and close the app when the callback is fired with SIGINT",
      signal: "SIGINT",
      expectedMessage: "Interrupted by user — Ctrl+C (SIGINT). Shutting down.",
    },
    {
      name: "should log the mapped SIGABRT message and close the app when the callback is fired with SIGABRT",
      signal: "SIGABRT",
      expectedMessage: "Process aborted (SIGABRT). Shutting down.",
    },
  ],
  UNMAPPED_FALLBACK_MESSAGE:
    "Shutdown signal received. Shutting down gracefully.",
  UNMAPPED_SIGNAL: castAsType<Signals>("SIGNOTREAL"),
} as const;

const createFakeHandle = () => ({
  close: vi.fn(),
  uninstall: vi.fn(),
});

interface CaptureEntry {
  captured: CloseWithGraceAsyncCallback | null;
  handle: ReturnType<typeof createFakeHandle>;
}

const captureRegistry = new WeakMap<FastifyBaseLogger, CaptureEntry>();

mockCloseWithGrace.mockImplementation(
  (
    options: { logger: FastifyBaseLogger },
    callback: CloseWithGraceAsyncCallback,
  ) => {
    const entry = captureRegistry.get(options.logger);

    if (!entry) {
      throw new Error("close-with-grace called without a registered capture");
    }

    entry.captured = callback;

    return entry.handle;
  },
);

const createCloseCapture = (app: FastifyInstance) => {
  const entry: CaptureEntry = {
    captured: null,
    handle: createFakeHandle(),
  };

  captureRegistry.set(app.log, entry);

  return {
    handle: entry.handle,
    getCallback: (): CloseWithGraceAsyncCallback => {
      if (!entry.captured) {
        throw new Error("close-with-grace callback was not captured");
      }

      return entry.captured;
    },
  };
};

describe("CloseHelper", () => {
  describe("setupCloseListeners", (it) => {
    it("should pin the app and handle to globalThis.__priorInstance", async ({
      expect,
      onTestFinished,
    }) => {
      await runWithPriorInstance(undefined, async () => {
        const app = createTestApp(onTestFinished);
        const { handle: fakeHandle } = createCloseCapture(app);

        const handle = await setupCloseListeners(app);

        expect(handle).toBe(fakeHandle);
        expect(globalThis.__priorInstance).toEqual({
          app,
          handle,
        });
      });
    });

    it("should close the prior instance when one exists", async ({
      expect,
      onTestFinished,
    }) => {
      const priorApp = createTestApp(onTestFinished);
      const priorHandle = createFakeHandle();
      const priorCloseSpy = vi.spyOn(priorApp, "close");

      await runWithPriorInstance(
        { app: priorApp, handle: priorHandle },
        async () => {
          const newApp = createTestApp(onTestFinished);
          const priorUninstallCallsBefore =
            priorHandle.uninstall.mock.calls.length;
          const priorCloseCallsBefore = priorCloseSpy.mock.calls.length;

          createCloseCapture(newApp);

          await setupCloseListeners(newApp);

          expect(priorHandle.uninstall.mock.calls.length).toBe(
            priorUninstallCallsBefore + 1,
          );
          expect(priorCloseSpy.mock.calls.length).toBe(
            priorCloseCallsBefore + 1,
          );
        },
      );
    });

    it("should log the error and close the app when the callback is fired with an err", async ({
      expect,
      onTestFinished,
    }) => {
      await runWithPriorInstance(undefined, async () => {
        const app = createTestApp(onTestFinished);
        const errorLogSpy = vi.spyOn(app.log, "error");
        const closeSpy = vi.spyOn(app, "close");
        const error = new Error("test-error");

        const { getCallback } = createCloseCapture(app);

        await setupCloseListeners(app);

        const callback = getCallback();
        const closeCallsBefore = closeSpy.mock.calls.length;

        await callback({ err: error, manual: false });

        expect(errorLogSpy).toHaveBeenNthCalledWith(
          errorLogSpy.mock.calls.length,
          { err: error },
          "server closing with error",
        );
        expect(closeSpy.mock.calls.length).toBe(closeCallsBefore + 1);
      });
    });

    it("should log the manual message and close the app when the callback is fired with manual", async ({
      expect,
      onTestFinished,
    }) => {
      await runWithPriorInstance(undefined, async () => {
        const app = createTestApp(onTestFinished);
        const infoLogSpy = vi.spyOn(app.log, "info");
        const closeSpy = vi.spyOn(app, "close");

        const { getCallback } = createCloseCapture(app);

        await setupCloseListeners(app);

        const callback = getCallback();
        const closeCallsBefore = closeSpy.mock.calls.length;

        await callback({ manual: true });

        expect(infoLogSpy).toHaveBeenNthCalledWith(
          infoLogSpy.mock.calls.length,
          "Another instance started (manual). Shutting down gracefully.",
        );
        expect(closeSpy.mock.calls.length).toBe(closeCallsBefore + 1);
      });
    });

    TEST_DATA.KNOWN_SIGNAL_CASES.forEach(
      ({ name, signal, expectedMessage }) => {
        it(name, async ({ expect, onTestFinished }) => {
          await runWithPriorInstance(undefined, async () => {
            const app = createTestApp(onTestFinished);
            const infoLogSpy = vi.spyOn(app.log, "info");
            const closeSpy = vi.spyOn(app, "close");

            const { getCallback } = createCloseCapture(app);

            await setupCloseListeners(app);

            const callback = getCallback();
            const closeCallsBefore = closeSpy.mock.calls.length;

            await callback({ manual: false, signal });

            expect(infoLogSpy).toHaveBeenNthCalledWith(
              infoLogSpy.mock.calls.length,
              expectedMessage,
            );
            expect(closeSpy.mock.calls.length).toBe(closeCallsBefore + 1);
          });
        });
      },
    );

    it("should log the fallback message when the signal is not in the error-messages map", async ({
      expect,
      onTestFinished,
    }) => {
      await runWithPriorInstance(undefined, async () => {
        const app = createTestApp(onTestFinished);
        const infoLogSpy = vi.spyOn(app.log, "info");
        const closeSpy = vi.spyOn(app, "close");

        const { getCallback } = createCloseCapture(app);

        await setupCloseListeners(app);

        const callback = getCallback();
        const closeCallsBefore = closeSpy.mock.calls.length;

        await callback({ manual: false, signal: TEST_DATA.UNMAPPED_SIGNAL });

        expect(infoLogSpy).toHaveBeenNthCalledWith(
          infoLogSpy.mock.calls.length,
          TEST_DATA.UNMAPPED_FALLBACK_MESSAGE,
        );
        expect(closeSpy.mock.calls.length).toBe(closeCallsBefore + 1);
      });
    });

    it("should log the fallback message when no signal/manual/err is provided", async ({
      expect,
      onTestFinished,
    }) => {
      await runWithPriorInstance(undefined, async () => {
        const app = createTestApp(onTestFinished);
        const infoLogSpy = vi.spyOn(app.log, "info");
        const closeSpy = vi.spyOn(app, "close");

        const { getCallback } = createCloseCapture(app);

        await setupCloseListeners(app);

        const callback = getCallback();
        const closeCallsBefore = closeSpy.mock.calls.length;

        await callback({ manual: false });

        expect(infoLogSpy).toHaveBeenNthCalledWith(
          infoLogSpy.mock.calls.length,
          "Shutdown signal received. Shutting down gracefully.",
        );
        expect(closeSpy.mock.calls.length).toBe(closeCallsBefore + 1);
      });
    });
  });
});
