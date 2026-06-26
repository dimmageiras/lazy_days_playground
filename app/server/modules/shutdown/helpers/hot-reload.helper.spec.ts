import type { Mock, Procedure } from "@vitest/spy";
import { describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ErrorHelper } from "@server/helpers/error.helper";
import type { AppInstance } from "@server/types/instance.type";

import { TypeHelper } from "@shared/helpers/type.helper";

import { HotReloadHelper } from "./hot-reload.helper";

const {
  createMockInstance,
  sharedTestData: { UNDEFINED_VALUE },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("hot-reload.helper");

const { normalizeError } = ErrorHelper;
const { castAsType } = TypeHelper;

const { acceptHotReload } = HotReloadHelper;

const { makeHot, ...TEST_DATA } = {
  CLOSE_FAILURE: new Error("close failed"),
  CLOSE_FAILURE_MESSAGE:
    "💥 Failed to close the previous instance during hot reload",
  get makeHot() {
    return (previousInstance?: { close: Mock<Procedure> }) => ({
      accept: vi.fn(),
      data: castAsType<{ instance?: AppInstance }>(
        previousInstance ? { instance: previousInstance } : {},
      ),
    });
  },
} as const;

describe("HotReloadHelper", () => {
  describe("acceptHotReload", (it) => {
    it("should do nothing when hot reloading is unavailable", async ({
      expect,
    }) => {
      const instance = createMockInstance();

      await expect(
        acceptHotReload(instance, UNDEFINED_VALUE),
      ).resolves.toBeUndefined();

      expect(instance.log.error).not.toHaveBeenCalled();
    });

    it("should register the instance and accept the update when there is no previous instance", async ({
      expect,
    }) => {
      const instance = createMockInstance();
      const hot = makeHot();

      await acceptHotReload(instance, castAsType<ImportMeta["hot"]>(hot));

      expect(hot.data.instance).toBe(instance);
      expect(hot.accept).toHaveBeenCalledTimes(1);
      expect(instance.log.error).not.toHaveBeenCalled();
    });

    it("should close the previous instance before registering the new one", async ({
      expect,
    }) => {
      const instance = createMockInstance();
      const close = vi.fn().mockResolvedValue(UNDEFINED_VALUE);
      const hot = makeHot({ close });

      await acceptHotReload(instance, castAsType<ImportMeta["hot"]>(hot));

      expect(close).toHaveBeenCalledTimes(1);
      expect(hot.data.instance).toBe(instance);
      expect(hot.accept).toHaveBeenCalledTimes(1);
      expect(instance.log.error).not.toHaveBeenCalled();
    });

    it("should log an error but still accept the update when closing the previous instance fails", async ({
      expect,
    }) => {
      const instance = createMockInstance();
      const close = vi.fn().mockRejectedValue(TEST_DATA.CLOSE_FAILURE);
      const hot = makeHot({ close });

      await acceptHotReload(instance, castAsType<ImportMeta["hot"]>(hot));

      expect(close).toHaveBeenCalledTimes(1);
      expect(instance.log.error).toHaveBeenNthCalledWith(
        1,
        normalizeError(TEST_DATA.CLOSE_FAILURE),
        TEST_DATA.CLOSE_FAILURE_MESSAGE,
      );
      expect(hot.data.instance).toBe(instance);
      expect(hot.accept).toHaveBeenCalledTimes(1);
    });
  });
});
