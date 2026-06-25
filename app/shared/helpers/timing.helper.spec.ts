import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { TIMING_IN_MS } from "@shared/constants/timing.constant";

import { TimingHelper } from "./timing.helper";

const {
  sharedTestData: { BOOLEAN_FALSE, BOOLEAN_TRUE },
  trackLeaksInSpec,
}: ReturnType<typeof VitestSetup> = VitestSetup();

trackLeaksInSpec("timing.helper");

const { delay } = TimingHelper;

const { SECONDS_ONE_TENTH } = TIMING_IN_MS;

const TEST_DATA = {
  PENDING_DELAY_MS: SECONDS_ONE_TENTH,
} as const;

describe("TimingHelper", () => {
  describe("delay", (it) => {
    it("should resolve to undefined once the delay elapses", async ({
      expect,
    }) => {
      const pending = delay(TEST_DATA.PENDING_DELAY_MS);

      expectTypeOf(pending).toEqualTypeOf<Promise<void>>();

      await expect(pending).resolves.toBeUndefined();
    });

    it("should stay pending until the delay elapses", async ({ expect }) => {
      let settled: boolean = BOOLEAN_FALSE;
      const pending = delay(TEST_DATA.PENDING_DELAY_MS).then(() => {
        settled = BOOLEAN_TRUE;
      });

      await Promise.resolve();

      expect(settled).toBe(BOOLEAN_FALSE);

      await pending;

      expect(settled).toBe(BOOLEAN_TRUE);
    });
  });
});
