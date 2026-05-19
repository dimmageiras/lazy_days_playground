import { VitestSetup } from "@configs/vitest/setup";
import { describe } from "vitest";

import { MapHelper } from "./map.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("map.helper");

const { getMapValue } = MapHelper;

const TEST_DATA = {
  LOOKUP_CASES: [
    {
      name: "should return the value for a key present in the map",
      key: "a",
      expected: 1,
    },
    {
      name: "should return undefined for a key absent from the map",
      key: "d",
      expected: undefined,
    },
  ],
  get MAP() {
    return new Map<string, number>([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  },
  NEW_KEY: "w",
  NEW_VALUE: 99,
} as const;

describe("MapHelper", () => {
  describe("getMapValue", (it) => {
    TEST_DATA.LOOKUP_CASES.forEach(({ name, key, expected }) => {
      it(name, ({ expect }) => {
        const result = getMapValue(TEST_DATA.MAP, key);

        expect(result).toBe(expected);
      });
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
