import { VitestSetup } from "@configs/vitest/setup";
import { describe, vi } from "vitest";

import { TimingHelper } from "./timing.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("timing.helper");

const { delay } = TimingHelper;

const TEST_DATA = {
  DELAY_CASES: [
    { name: "should resolve immediately for 0ms", ms: 0 },
    { name: "should resolve after 100ms", ms: 100 },
    { name: "should resolve after 1000ms", ms: 1000 },
  ],
  NOT_YET_ELAPSED_MS: 99,
  PENDING_DELAY_MS: 100,
} as const;

describe("TimingHelper", () => {
  describe("delay", (it) => {
    TEST_DATA.DELAY_CASES.forEach(({ name, ms }) => {
      it(name, async ({ expect, onTestFinished }) => {
        vi.useFakeTimers();

        let resolved = false;

        const promise = delay(ms).then(() => {
          resolved = true;
        });

        await vi.advanceTimersByTimeAsync(ms);
        await promise;

        expect(resolved).toBe(true);

        onTestFinished(() => {
          vi.useRealTimers();
        });
      });
    });

    it("should not resolve before the specified time elapses", async ({
      expect,
      onTestFinished,
    }) => {
      vi.useFakeTimers();

      let resolved = false;

      delay(TEST_DATA.PENDING_DELAY_MS).then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(TEST_DATA.NOT_YET_ELAPSED_MS);

      expect(resolved).toBe(false);

      onTestFinished(() => {
        vi.useRealTimers();
      });
    });

    it("should resolve with undefined", async ({ expect, onTestFinished }) => {
      vi.useFakeTimers();

      const promise = delay(0);

      await vi.advanceTimersByTimeAsync(0);

      const result = await promise;

      expect(result).toBeUndefined();

      onTestFinished(() => {
        vi.useRealTimers();
      });
    });
  });
});
