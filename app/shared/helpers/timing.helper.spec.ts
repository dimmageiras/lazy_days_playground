import type { setTimeout } from "node:timers";
import type { MockInstance } from "vitest";
import { describe, expectTypeOf, vi } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TimingHelper } from "./timing.helper";
import { TypeHelper } from "./type.helper";

const {
  sharedTestData: { BOOLEAN_FALSE, BOOLEAN_TRUE, NAN_VALUE },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("timing.helper");

const { castAsType } = TypeHelper;

const { delay } = TimingHelper;

const { stubSetTimeout, ...TEST_DATA } = {
  PASSTHROUGH_CASES: [
    { ms: -1, name: "should forward -1 to setTimeout" },
    { ms: 0, name: "should forward 0 to setTimeout" },
    {
      ms: NAN_VALUE,
      name: "should forward NaN to setTimeout",
    },
    {
      ms: Number.POSITIVE_INFINITY,
      name: "should forward Infinity to setTimeout",
    },
  ],
  RESOLVE_MARKER_MS: -1001,
  RESOLVE_PENDING_MARKER_MS: -1002,
  get stubSetTimeout() {
    return castAsType<typeof setTimeout>(() => 0);
  },
} as const;

describe("TimingHelper", () => {
  describe("delay", (it) => {
    const { afterAll, beforeAll } = it;

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

    it("should resolve to undefined once the scheduled callback fires", async ({
      expect,
    }) => {
      const marker = TEST_DATA.RESOLVE_MARKER_MS;

      const pending = delay(marker);

      expectTypeOf(pending).toEqualTypeOf<Promise<void>>();

      const spyCalls = setTimeoutSpy.mock.calls.filter(([, delayMs]) =>
        Object.is(delayMs, marker),
      );

      expect(spyCalls).toHaveLength(1);

      const [callback] = spyCalls[0]!;

      callback();

      await expect(pending).resolves.toBeUndefined();
    });

    it("should stay pending until the scheduled callback fires", async ({
      expect,
    }) => {
      const marker = TEST_DATA.RESOLVE_PENDING_MARKER_MS;

      let settled: boolean = BOOLEAN_FALSE;
      const pending = delay(marker).then(() => {
        settled = BOOLEAN_TRUE;
      });

      const spyCalls = setTimeoutSpy.mock.calls.filter(([, delayMs]) =>
        Object.is(delayMs, marker),
      );

      expect(spyCalls).toHaveLength(1);

      const [callback] = spyCalls[0]!;

      await Promise.resolve();

      expect(settled).toBe(BOOLEAN_FALSE);

      callback();

      await pending;

      expect(settled).toBe(BOOLEAN_TRUE);
    });
  });
});
