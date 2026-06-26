import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { BASE_URLS } from "@server/constants/base-urls.constant";
import type {
  ShutdownHandler,
  ShutdownOptions,
  ShutdownRouteOptions,
} from "@server/modules/shutdown/types/shutdown.type";

import { TypeHelper } from "@shared/helpers/type.helper";

import { REDACT_PATHS } from "./constants/redact.constant";
import { routes } from "./routes";
import { ShutdownModule } from "./shutdown.module";

const {
  mockAcceptHotReload,
  mockBuildShutdownHandler,
  mockBuildShutdownOptions,
  mockCloseWithGrace,
  mockUninstall,
} = vi.hoisted(() => ({
  mockAcceptHotReload: vi.fn(),
  mockBuildShutdownHandler: vi.fn(),
  mockBuildShutdownOptions: vi.fn(),
  mockCloseWithGrace: vi.fn(),
  mockUninstall: vi.fn(),
}));

vi.mock("close-with-grace", () => ({ default: mockCloseWithGrace }));

vi.mock("./helpers/close-with-grace.helper", () => ({
  CloseWithGraceHelper: {
    buildShutdownHandler: mockBuildShutdownHandler,
    buildShutdownOptions: mockBuildShutdownOptions,
  },
}));

vi.mock("./helpers/hot-reload.helper", () => ({
  HotReloadHelper: { acceptHotReload: mockAcceptHotReload },
}));

const {
  createMockInstance,
  sharedTestData: { UNDEFINED_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("shutdown.module");

const { API_INTERNAL } = BASE_URLS;

const { castAsType } = TypeHelper;

const { redactPaths, setupShutdown } = ShutdownModule;

const TEST_DATA = {
  HANDLE: castAsType<ShutdownRouteOptions["handle"]>({
    uninstall: mockUninstall,
  }),
  ON_CLOSE: "onClose",
  SHUTDOWN_HANDLER: castAsType<ShutdownHandler>(() => Promise.resolve()),
  SHUTDOWN_OPTIONS: castAsType<ShutdownOptions>({}),
} as const;

describe("ShutdownModule", () => {
  describe("redactPaths", (it) => {
    it("should re-export the shared redaction paths", ({ expect }) => {
      expect(redactPaths).toBe(REDACT_PATHS);
    });
  });

  describe("setupShutdown", (it) => {
    const { beforeAll, afterAll } = it;

    beforeAll(() => {
      mockBuildShutdownOptions.mockReturnValue(TEST_DATA.SHUTDOWN_OPTIONS);
      mockBuildShutdownHandler.mockReturnValue(TEST_DATA.SHUTDOWN_HANDLER);
      mockCloseWithGrace.mockReturnValue(TEST_DATA.HANDLE);
      mockAcceptHotReload.mockResolvedValue(UNDEFINED_VALUE);
    });

    afterAll(() => {
      mockAcceptHotReload.mockReset();
      mockBuildShutdownHandler.mockReset();
      mockBuildShutdownOptions.mockReset();
      mockCloseWithGrace.mockReset();
      mockUninstall.mockReset();
    });

    it("should install close-with-grace, register an onClose hook that uninstalls the handle, accept hot reload, and register the routes", async ({
      expect,
    }) => {
      const addHook = vi.fn();
      const register = vi.fn().mockResolvedValue(UNDEFINED_VALUE);
      const instance = createMockInstance();

      Reflect.set(instance, "addHook", addHook);
      Reflect.set(instance, "register", register);

      await setupShutdown(instance, UNDEFINED_VALUE);

      expect(mockBuildShutdownOptions).toHaveBeenNthCalledWith(1, instance.log);
      expect(mockBuildShutdownHandler).toHaveBeenNthCalledWith(1, instance);
      expect(mockCloseWithGrace).toHaveBeenNthCalledWith(
        1,
        TEST_DATA.SHUTDOWN_OPTIONS,
        TEST_DATA.SHUTDOWN_HANDLER,
      );
      expect(addHook).toHaveBeenNthCalledWith(
        1,
        TEST_DATA.ON_CLOSE,
        expect.any(Function),
      );
      expect(mockAcceptHotReload).toHaveBeenNthCalledWith(
        1,
        instance,
        UNDEFINED_VALUE,
      );
      expect(register).toHaveBeenNthCalledWith(1, routes, {
        handle: TEST_DATA.HANDLE,
        prefix: API_INTERNAL,
      });

      const onCloseHook = castAsType<() => Promise<void>>(
        addHook.mock.calls[0]?.[1],
      );

      await onCloseHook();

      expect(mockUninstall).toHaveBeenNthCalledWith(1);
    });
  });
});
