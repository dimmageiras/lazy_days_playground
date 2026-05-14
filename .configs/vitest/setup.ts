import type { Mock, Procedure } from "@vitest/spy";
import type { UnknownArray } from "type-fest";
import { vi } from "vitest";

import "@testing-library/jest-dom/vitest";

const sessionMocks = vi.hoisted(() => ({
  mockGetMapValue: vi.fn(),
  mockGetMapValueProbe: { forceMapLookupMiss: false },
}));

vi.mock("@shared/helpers/map-utils.helper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@shared/helpers/map-utils.helper")>();

  sessionMocks.mockGetMapValue.mockImplementation(
    actual.MapUtilsHelper.getMapValue as (...args: UnknownArray) => unknown,
  );

  return {
    MapUtilsHelper: {
      getMapValue: (...args: UnknownArray): ReturnType<Mock<Procedure>> =>
        sessionMocks.mockGetMapValueProbe.forceMapLookupMiss
          ? undefined
          : sessionMocks.mockGetMapValue(...args),
    },
  };
});

const vitestHelpers = () => {
  return {
    ...sessionMocks,
  };
};

export { vitestHelpers };
