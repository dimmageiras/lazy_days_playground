import type { UnionToIntersection } from "type-fest";
import { expect } from "vitest";

import { StringHelper } from "@shared/helpers/string.helper";

import { SHARED_TEST_DATA } from "./constants/shared-test-data.constant";
import { FakeTimerRegistry } from "./fake-timer-registry";
import type * as VitestHelpers from "./helpers";
import { StateProbeHelper } from "./helpers";

const { isString } = StringHelper;

const { installHijack, recordFakeTimerFile } = FakeTimerRegistry;

// Setup module owns the fake-timer registry state (Vitest setup files are
// allowed to carry state under `isolate: false`; helpers must not). The hijack
// is gated on the same probe flag the helper uses — when the probe is off,
// the registry is never read, so paying the wrapper cost is wasted.
if (process.env.DEBUG_TEST_POLLUTION === "1") {
  installHijack(() => {
    // `testPath` is a Jest-compat surface on `expect.getState()`; reverify presence on Vitest major bumps.
    const { testPath } = expect.getState();

    if (isString(testPath)) {
      recordFakeTimerFile(testPath);
    }
  });
}

type VitestSetupReturn = UnionToIntersection<
  (typeof VitestHelpers)[keyof typeof VitestHelpers]
> & { sharedTestData: typeof SHARED_TEST_DATA };

const vitestSetupValue: VitestSetupReturn = Object.freeze({
  ...StateProbeHelper,
  sharedTestData: SHARED_TEST_DATA,
} as const);

const VitestSetup = (): VitestSetupReturn => {
  return vitestSetupValue;
};

export { VitestSetup };
