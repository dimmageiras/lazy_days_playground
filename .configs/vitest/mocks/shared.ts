import type { Mock, Procedure } from "@vitest/spy";
import type { UnknownArray } from "type-fest";
import { vi } from "vitest";

const sharedMocks = vi.hoisted(() => ({
  mockGetMapValue: vi.fn(),
  mockGetMapValueProbe: { forceMapLookupMiss: false },
}));

vi.mock("@shared/helpers/map-utils.helper", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@shared/helpers/map-utils.helper")>();

  sharedMocks.mockGetMapValue.mockImplementation(
    actual.MapUtilsHelper.getMapValue,
  );

  return {
    MapUtilsHelper: {
      getMapValue: (...args: UnknownArray): ReturnType<Mock<Procedure>> =>
        sharedMocks.mockGetMapValueProbe.forceMapLookupMiss
          ? undefined
          : sharedMocks.mockGetMapValue(...args),
    },
  };
});

export { sharedMocks };
