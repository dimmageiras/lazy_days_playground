import type { UnionToIntersection } from "type-fest";
import { expect } from "vitest";

import "@testing-library/jest-dom/vitest";

import { FakeTimerRegistry } from "./fake-timer-registry";
import type * as ViteHelpers from "./helpers";
import { StateProbeHelper } from "./helpers";

// Setup module owns the fake-timer registry state (Vitest setup files are
// allowed to carry state under `isolate: false`; helpers must not).
FakeTimerRegistry.installHijack(() => {
  // `testPath` is a Jest-compat surface on `expect.getState()`; reverify presence on Vitest major bumps.
  const { testPath } = expect.getState();

  if (typeof testPath === "string") {
    FakeTimerRegistry.recordFakeTimerFile(testPath);
  }
});

type VitestSetupReturn = UnionToIntersection<
  (typeof ViteHelpers)[keyof typeof ViteHelpers]
>;

const vitestSetupValue: VitestSetupReturn = Object.freeze({
  ...StateProbeHelper,
});

const VitestSetup = (): VitestSetupReturn => vitestSetupValue;

export { VitestSetup };
