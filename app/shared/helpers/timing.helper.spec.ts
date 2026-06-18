import type { setTimeout } from "node:timers";
import type { MockInstance } from "vitest";
import { afterAll, beforeAll, describe, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TimingHelper } from "./timing.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec }: Awaited<ReturnType<typeof VitestSetup>> =
  await VitestSetup();

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
  RESOLVE_MARKER_MS: -1001,
  RESOLVE_PENDING_MARKER_MS: -1002,
} as const;

const stubSetTimeout = castAsType<typeof setTimeout>(() => 0);

describe("TimingHelper", () => {
  describe("delay", (it) => {
    let setTimeoutSpy: MockInstance<typeof setTimeout>;

    beforeAll(() => {
      setTimeoutSpy = vi
        .spyOn(globalThis, "setTimeout")
        .mockImplementation(stubSetTimeout);
    });

    afterAll(() => {
      setTimeoutSpy.mockRestore();
    });

    TEST_DATA.PASSTHROUGH_CASES.forEach(({ ms, name }) => {
      it(name, ({ expect }) => {
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
      const marker = TEST_DATA.RESOLVE_MARKER_MS;

      const promise = delay(marker);

      const spyCalls = setTimeoutSpy.mock.calls.filter(([, delayMs]) =>
        Object.is(delayMs, marker),
      );

      expect(spyCalls).toHaveLength(1);

      const [callback] = spyCalls[0]!;

      expect(promise).toBeInstanceOf(Promise);
      expect(callback).toBeTypeOf("function");

      callback();

      const result = await promise;

      expect(result).toBeUndefined();
    });

    it("should not resolve before the scheduled callback fires", async ({
      expect,
    }) => {
      const marker = TEST_DATA.RESOLVE_PENDING_MARKER_MS;

      let resolved = false;

      const promise = delay(marker).then(() => {
        resolved = true;
      });

      const spyCalls = setTimeoutSpy.mock.calls.filter(([, delayMs]) =>
        Object.is(delayMs, marker),
      );

      expect(spyCalls).toHaveLength(1);

      const [callback] = spyCalls[0]!;

      await Promise.resolve();

      expect(resolved).toBe(false);

      callback();

      await promise;

      expect(resolved).toBe(true);
    });
  });
});
