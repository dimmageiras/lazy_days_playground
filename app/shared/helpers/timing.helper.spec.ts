import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { TimingHelper } from "./timing.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("timing.helper");

const { delay } = TimingHelper;

const TEST_DATA = {
  DELAY_CASES: [
    { ms: 0, name: "should resolve on next tick for 0ms" },
    { ms: 100, name: "should resolve after 100ms" },
  ],
  WAIT_MS_FLOOR: 45,
  WAIT_MS: 50,
} as const;

describe("TimingHelper", () => {
  describe("delay", (it) => {
    TEST_DATA.DELAY_CASES.forEach(({ ms, name }) => {
      it(name, async ({ expect }) => {
        let resolved = false;

        const promise = delay(ms).then(() => {
          resolved = true;
        });

        await promise;

        expect(resolved).toBe(true);
      });
    });

    it("resolves with undefined", async ({ expect }) => {
      const promise = delay(0);

      const result = await promise;

      expect(promise).toBeInstanceOf(Promise);
      expect(result).toBeUndefined();
    });

    it("waits at least the specified time", async ({ expect }) => {
      const start = performance.now();

      await delay(TEST_DATA.WAIT_MS);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(TEST_DATA.WAIT_MS_FLOOR);
    });
  });
});
