import { VitestSetup } from "@configs/vitest/setup";
import type { setTimeout } from "node:timers";
import { afterEach, describe, vi } from "vitest";

import { TimingHelper } from "./timing.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("timing.helper");

const { castAsType } = TypesHelper;

const { delay } = TimingHelper;

const TEST_DATA = {
  PASSTHROUGH_CASES: [
    { ms: -1, name: "should forward -1 to setTimeout" },
    { ms: 0, name: "should forward 0 to setTimeout" },
    { ms: 100, name: "should forward 100 to setTimeout" },
    { ms: Number.NaN, name: "should forward NaN to setTimeout" },
    {
      ms: Number.POSITIVE_INFINITY,
      name: "should forward Infinity to setTimeout",
    },
  ],
} as const;

const stubSetTimeout = <T extends Parameters<typeof setTimeout>[0]>(
  capture: (callback: T) => void,
) =>
  castAsType<typeof setTimeout>((callback: T) => {
    capture(callback);

    return 0;
  });

describe("TimingHelper", () => {
  describe("delay", (it) => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    TEST_DATA.PASSTHROUGH_CASES.forEach(({ ms, name }) => {
      it(name, ({ expect }) => {
        const setTimeoutSpy = vi
          .spyOn(globalThis, "setTimeout")
          .mockImplementation(stubSetTimeout(() => undefined));

        void delay(ms);

        const spyCalls = setTimeoutSpy.mock.calls.filter(([, delayMs]) =>
          Object.is(delayMs, ms),
        );

        expect(spyCalls).toHaveLength(1);
      });
    });

    it("should resolve with undefined once the scheduled callback fires", async ({
      expect,
    }) => {
      let capturedCallback: Parameters<typeof setTimeout>[0] | undefined;

      vi.spyOn(globalThis, "setTimeout").mockImplementation(
        stubSetTimeout((callback) => {
          capturedCallback = callback;
        }),
      );

      const promise = delay(0);

      expect(promise).toBeInstanceOf(Promise);
      expect(capturedCallback).toBeTypeOf("function");

      capturedCallback?.();

      const result = await promise;

      expect(result).toBeUndefined();
    });

    it("should not resolve before the scheduled callback fires", async ({
      expect,
    }) => {
      let capturedCallback: Parameters<typeof setTimeout>[0] | undefined;

      vi.spyOn(globalThis, "setTimeout").mockImplementation(
        stubSetTimeout((callback) => {
          capturedCallback = callback;
        }),
      );

      let resolved = false;

      const promise = delay(0).then(() => {
        resolved = true;
      });

      await Promise.resolve();

      expect(resolved).toBe(false);

      capturedCallback?.();

      await promise;

      expect(resolved).toBe(true);
    });
  });
});
