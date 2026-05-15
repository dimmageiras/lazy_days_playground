import type { Mock, Procedure } from "@vitest/spy";
import type { UnknownArray } from "type-fest";
import { vi } from "vitest";

import type * as MapUtilsHelperModule from "@shared/helpers/map-utils.helper";

const sharedMocks = vi.hoisted(() => ({
  mockGetMapValue: vi.fn(),
  mockGetMapValueProbe: { forceMapLookupMiss: false },
}));

vi.mock("@shared/helpers/map-utils.helper", async (importOriginal) => {
  const actual = await importOriginal<typeof MapUtilsHelperModule>();

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
