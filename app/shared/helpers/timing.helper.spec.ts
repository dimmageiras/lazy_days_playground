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
    { ms: -1, name: "should resolve when given a negative number" },
    {
      ms: Number.NaN,
      name: "should resolve when given NaN",
    },
    {
      ms: Number.POSITIVE_INFINITY,
      name: "should resolve when given Infinity (clamps to next macrotask)",
    },
  ],
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

    it("should resolve with undefined", async ({ expect }) => {
      const promise = delay(0);

      const result = await promise;

      expect(promise).toBeInstanceOf(Promise);
      expect(result).toBeUndefined();
    });

    it("should not resolve synchronously — delay(0) yields to the next microtask", async ({
      expect,
    }) => {
      let resolved = false;

      const promise = delay(0).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      await promise;

      expect(resolved).toBe(true);
    });
  });
});
