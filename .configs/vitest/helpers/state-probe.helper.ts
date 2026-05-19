import type { Mock, Procedure } from "@vitest/spy";
import { afterEach } from "vitest";

import { ObjectHelper } from "@shared/helpers/object.helper";

import { ServerMock } from "../mocks";

const { getObjectEntries } = ObjectHelper;

const isMockProcedure = (value: unknown): value is Mock<Procedure> => {
  return value instanceof Object && "mock" in value;
};

const getMockProcedureState = (
  name: string,
  mockProcedure: unknown,
): string => {
  if (isMockProcedure(mockProcedure)) {
    return `${name}=${mockProcedure.mock.calls.length}`;
  }

  return "undef";
};

const trackEndStateAfterEach = (specName: string): void => {
  if (process.env.DEBUG_TEST_POLLUTION !== "1") {
    return;
  }

  afterEach(({ task }) => {
    const parts = [
      ...getObjectEntries(ServerMock).map(([name, mockProcedure]) =>
        getMockProcedureState(name, mockProcedure),
      ),
      `prior=${globalThis.__priorInstance === undefined ? "undef" : "set"}`,
    ];

    process.stderr.write(
      `[END ${specName} > ${task.name}] ${parts.join(" ")}\n`,
    );
  });
};

const StateProbeHelper = Object.freeze({
  trackEndStateAfterEach,
} as const);

export { StateProbeHelper };
