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
} = vi.hoisted(() => ({
  mockAcceptHotReload: vi.fn(),
  mockBuildShutdownHandler: vi.fn(),
  mockBuildShutdownOptions: vi.fn(),
  mockCloseWithGrace: vi.fn(),
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
  ON_CLOSE: "onClose",
} as const;

describe("ShutdownModule", () => {
  describe("redactPaths", (it) => {
    it("should re-export the shared redaction paths", ({ expect }) => {
      expect(redactPaths).toBe(REDACT_PATHS);
    });
  });

  describe("setupShutdown", (it) => {
    const { afterAll } = it;

    afterAll(() => {
      mockAcceptHotReload.mockReset();
      mockBuildShutdownHandler.mockReset();
      mockBuildShutdownOptions.mockReset();
      mockCloseWithGrace.mockReset();
    });

    it("should install close-with-grace, register an onClose hook that uninstalls the handle, accept hot reload, and register the routes", async ({
      expect,
    }) => {
      const addHook = vi.fn();
      const register = vi.fn().mockResolvedValue(UNDEFINED_VALUE);
      const uninstall = vi.fn();
      const handle = castAsType<ShutdownRouteOptions["handle"]>({ uninstall });
      const options = castAsType<ShutdownOptions>({});
      const handler = castAsType<ShutdownHandler>(() => Promise.resolve());
      const instance = createMockInstance();

      Reflect.set(instance, "addHook", addHook);
      Reflect.set(instance, "register", register);

      mockBuildShutdownOptions.mockReturnValue(options);
      mockBuildShutdownHandler.mockReturnValue(handler);
      mockCloseWithGrace.mockReturnValue(handle);
      mockAcceptHotReload.mockResolvedValue(UNDEFINED_VALUE);

      await setupShutdown(instance, UNDEFINED_VALUE);

      expect(
        mockBuildShutdownOptions.mock.calls.filter(
          ([calledWith]) => calledWith === instance.log,
        ),
      ).toStrictEqual([[instance.log]]);
      expect(
        mockBuildShutdownHandler.mock.calls.filter(
          ([calledWith]) => calledWith === instance,
        ),
      ).toStrictEqual([[instance]]);
      expect(
        mockCloseWithGrace.mock.calls.filter(
          ([calledWith]) => calledWith === options,
        ),
      ).toStrictEqual([[options, handler]]);
      expect(addHook).toHaveBeenNthCalledWith(
        1,
        TEST_DATA.ON_CLOSE,
        expect.any(Function),
      );
      expect(
        mockAcceptHotReload.mock.calls.filter(
          ([calledWith]) => calledWith === instance,
        ),
      ).toStrictEqual([[instance, UNDEFINED_VALUE]]);
      expect(register).toHaveBeenNthCalledWith(1, routes, {
        handle,
        prefix: API_INTERNAL,
      });

      const onCloseHook = castAsType<() => Promise<void>>(
        addHook.mock.calls[0]?.[1],
      );

      await onCloseHook();

      expect(uninstall).toHaveBeenCalledTimes(1);
    });
  });
});
