import "@testing-library/jest-dom/vitest";

import {
  FastifyHelper,
  GlobalThisScopeHelper,
  ProcessScopeHelper,
  StateProbeHelper,
} from "./helpers";
import { ServerMock } from "./mocks";

type VitestSetupReturn = typeof FastifyHelper &
  typeof GlobalThisScopeHelper &
  typeof ProcessScopeHelper &
  typeof ServerMock &
  typeof StateProbeHelper;

const vitestSetupValue: VitestSetupReturn = Object.freeze({
  ...FastifyHelper,
  ...GlobalThisScopeHelper,
  ...ProcessScopeHelper,
  ...ServerMock,
  ...StateProbeHelper,
});

const VitestSetup = (): VitestSetupReturn => vitestSetupValue;

export { VitestSetup };
