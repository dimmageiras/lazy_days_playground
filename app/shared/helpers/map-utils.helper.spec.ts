import { describe } from "vitest";

import { MapUtilsHelper } from "./map-utils.helper";

const { getMapValue } = MapUtilsHelper;

const TEST_DATA = {
  ABSENT_KEY: "d",
  NEW_KEY: "w",
  NEW_VALUE: 99,
  PRESENT_KEY: "a",
  PRESENT_VALUE: 1,
  get MAP() {
    return new Map<string, number>([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  },
} as const;

describe("MapUtilsHelper", () => {
  describe("getMapValue", (it) => {
    it("should return the value for a key present in the map", ({ expect }) => {
      const result = getMapValue(TEST_DATA.MAP, TEST_DATA.PRESENT_KEY);

      expect(result).toBe(TEST_DATA.PRESENT_VALUE);
    });

    it("should return undefined for a key absent from the map", ({
      expect,
    }) => {
      const result = getMapValue(TEST_DATA.MAP, TEST_DATA.ABSENT_KEY);

      expect(result).toBeUndefined();
    });

    it("should return the value for a key added to the map after creation", ({
      expect,
    }) => {
      const map = TEST_DATA.MAP;

      map.set(TEST_DATA.NEW_KEY, TEST_DATA.NEW_VALUE);

      const result = getMapValue(map, TEST_DATA.NEW_KEY);

      expect(result).toBe(TEST_DATA.NEW_VALUE);
    });
  });
});
