import { VitestSetup } from "@configs/vitest/setup";
import type { FastifyInstance } from "fastify";
import { describe, vi } from "vitest";

import { bootstrapServer } from "./bootstrap.module";
import type * as ClaimPortHelper from "./helpers/claim-port.helper";
import type * as CloseHelper from "./helpers/close.helper";
import type * as ShutdownRoute from "./routes/shutdown.route";
import type { BootstrapConfig, CloseWithGraceReturn } from "./types";

const { fakeShutdownRoute, mockClaimPort, mockSetupCloseListeners } =
  vi.hoisted(() => ({
    fakeShutdownRoute: async () => {},
    mockClaimPort: vi.fn<(config: BootstrapConfig) => Promise<void>>(),
    mockSetupCloseListeners:
      vi.fn<(app: FastifyInstance) => Promise<CloseWithGraceReturn>>(),
  }));

vi.mock("./helpers/claim-port.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof ClaimPortHelper>();

  return {
    ...actual,
    ClaimPortHelper: Object.freeze({
      claimPort: mockClaimPort,
    }),
  };
});

vi.mock("./helpers/close.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof CloseHelper>();

  return {
    ...actual,
    CloseHelper: Object.freeze({
      setupCloseListeners: mockSetupCloseListeners,
    }),
  };
});

vi.mock("./routes/shutdown.route", async (importOriginal) => {
  const actual = await importOriginal<typeof ShutdownRoute>();

  return {
    ...actual,
    shutdownRoute: fakeShutdownRoute,
  };
});

const { createTestApp, trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("bootstrap.module");

const TEST_DATA = {
  PORT: 5173,
  TOKEN: "test-token-value",
} as const;

const createFakeCloseListeners = (): CloseWithGraceReturn => ({
  close: vi.fn(),
  uninstall: vi.fn(),
});

const setupHappyPath = (): CloseWithGraceReturn => {
  const fakeListeners = createFakeCloseListeners();

  mockSetupCloseListeners.mockResolvedValueOnce(fakeListeners);
  mockClaimPort.mockResolvedValueOnce(undefined);

  return fakeListeners;
};

describe("BootstrapModule", () => {
  describe("bootstrapServer", (it) => {
    it("should call setupCloseListeners with the provided app", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      setupHappyPath();

      await bootstrapServer({
        app,
        port: TEST_DATA.PORT,
        token: TEST_DATA.TOKEN,
      });

      const wasCalledWithApp = mockSetupCloseListeners.mock.calls.some(
        ([receivedApp]) => receivedApp === app,
      );

      expect(wasCalledWithApp).toBe(true);
    });

    it("should register the shutdown route plugin with the close listeners and the token", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);
      const fakeListeners = setupHappyPath();
      const registerSpy = vi.spyOn(app, "register");

      await bootstrapServer({
        app,
        port: TEST_DATA.PORT,
        token: TEST_DATA.TOKEN,
      });

      const matchedCall = registerSpy.mock.calls.some(([plugin, options]) => {
        const opts = options as
          | { closeListeners: unknown; token: unknown }
          | undefined;

        return (
          plugin === fakeShutdownRoute &&
          opts?.closeListeners === fakeListeners &&
          opts?.token === TEST_DATA.TOKEN
        );
      });

      expect(matchedCall).toBe(true);
    });

    it("should call claimPort with the provided config", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);

      setupHappyPath();

      await bootstrapServer({
        app,
        port: TEST_DATA.PORT,
        token: TEST_DATA.TOKEN,
      });

      const matchedCall = mockClaimPort.mock.calls.some(
        ([config]) =>
          config.app === app &&
          config.port === TEST_DATA.PORT &&
          config.token === TEST_DATA.TOKEN,
      );

      expect(matchedCall).toBe(true);
    });

    it("should propagate errors thrown by setupCloseListeners", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);
      const error = new Error("setup failed");

      mockSetupCloseListeners.mockRejectedValueOnce(error);

      await expect(
        bootstrapServer({
          app,
          port: TEST_DATA.PORT,
          token: TEST_DATA.TOKEN,
        }),
      ).rejects.toBe(error);
    });

    it("should propagate errors thrown by claimPort", async ({
      expect,
      onTestFinished,
    }) => {
      const app = createTestApp(onTestFinished);
      const fakeListeners = createFakeCloseListeners();
      const error = new Error("claim failed");

      mockSetupCloseListeners.mockResolvedValueOnce(fakeListeners);
      mockClaimPort.mockRejectedValueOnce(error);

      await expect(
        bootstrapServer({
          app,
          port: TEST_DATA.PORT,
          token: TEST_DATA.TOKEN,
        }),
      ).rejects.toBe(error);
    });
  });
});
