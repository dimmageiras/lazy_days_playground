import type { UnionToIntersection } from "type-fest";
import { expect } from "vitest";

import { FakeTimerRegistry } from "./fake-timer-registry";
import type * as VitestHelpers from "./helpers";
import { StateProbeHelper } from "./helpers";

// Setup module owns the fake-timer registry state (Vitest setup files are
// allowed to carry state under `isolate: false`; helpers must not). The hijack
// is gated on the same probe flag the helper uses — when the probe is off,
// the registry is never read, so paying the wrapper cost is wasted.
if (process.env.DEBUG_TEST_POLLUTION === "1") {
  FakeTimerRegistry.installHijack(() => {
    // `testPath` is a Jest-compat surface on `expect.getState()`; reverify presence on Vitest major bumps.
    const { testPath } = expect.getState();

    if (typeof testPath === "string") {
      FakeTimerRegistry.recordFakeTimerFile(testPath);
    }
  });
}

type VitestSetupReturn = UnionToIntersection<
  (typeof VitestHelpers)[keyof typeof VitestHelpers]
>;

const vitestSetupValue: VitestSetupReturn = Object.freeze({
  ...StateProbeHelper,
} as const);

const VitestSetup = (): VitestSetupReturn => vitestSetupValue;

export { VitestSetup };
