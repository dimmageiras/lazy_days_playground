import type { UnionToIntersection } from "type-fest";
import { expect } from "vitest";

import type { SHARED_TEST_DATA } from "./constants/shared-test-data.constant";
import { FakeTimerRegistry } from "./fake-timer-registry";
import type * as VitestHelpers from "./helpers";
import { StateProbeHelper } from "./helpers";

const importSharedTestData = async () =>
  await import("./constants/shared-test-data.constant");

const { installHijack, recordFakeTimerFile } = FakeTimerRegistry;

// Setup module owns the fake-timer registry state (Vitest setup files are
// allowed to carry state under `isolate: false`; helpers must not). The hijack
// is gated on the same probe flag the helper uses — when the probe is off,
// the registry is never read, so paying the wrapper cost is wasted.
if (process.env.DEBUG_TEST_POLLUTION === "1") {
  installHijack(() => {
    // `testPath` is a Jest-compat surface on `expect.getState()`; reverify presence on Vitest major bumps.
    const { testPath } = expect.getState();

    if (typeof testPath === "string") {
      recordFakeTimerFile(testPath);
    }
  });
}

type VitestSetupValue = UnionToIntersection<
  (typeof VitestHelpers)[keyof typeof VitestHelpers]
>;

type VitestSetupReturn = VitestSetupValue & {
  sharedTestData: typeof SHARED_TEST_DATA;
};

const vitestSetupValue: VitestSetupValue = Object.freeze({
  ...StateProbeHelper,
} as const);

const VitestSetup = async (): Promise<VitestSetupReturn> => {
  const { SHARED_TEST_DATA } = await importSharedTestData();

  return { ...vitestSetupValue, sharedTestData: SHARED_TEST_DATA };
};

export { VitestSetup };
