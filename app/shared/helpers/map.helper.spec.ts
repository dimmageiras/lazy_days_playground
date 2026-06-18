import { Map as ImmutableMap } from "immutable";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { MapValue } from "@shared/types/app/utility-types";

import { MapHelper } from "./map.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec }: Awaited<ReturnType<typeof VitestSetup>> =
  await VitestSetup();

trackLeaksInSpec("map.helper");

const { castAsType } = TypesHelper;

const { getMapValue } = MapHelper;

const { makeImmutableMap, makeLiteralMap, makeMap, ...TEST_DATA } = {
  GET_CASES: [
    {
      expected: 1,
      key: "a",
      name: "should return the value mapped to a present key",
    },
    {
      expected: 3,
      key: "c",
      name: "should return the value mapped to another present key",
    },
    {
      expected: undefined,
      key: "z",
      name: "should return undefined for an absent key",
    },
  ],
  MAP_ENTRIES: castAsType<ReadonlyArray<readonly [string, number]>>([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]),
  TYPE_TEST: {
    FALLBACK: castAsType<string>("fallback"),
    KEY: castAsType<string>("a"),
    NON_KEY: castAsType<string>("z"),
  },
  get makeImmutableMap() {
    return () => ImmutableMap<string, number>(this.MAP_ENTRIES);
  },
  get makeLiteralMap() {
    return () =>
      new Map<"a" | "b" | "c", number>([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
  },
  get makeMap() {
    return () => new Map<string, number>(this.MAP_ENTRIES);
  },
  get makeMapWithUndefined() {
    return () => new Map<string, number | undefined>([["present", undefined]]);
  },
  get makeNumberMap() {
    return () =>
      new Map<1 | 2 | 3, number>([
        [1, 10],
        [2, 20],
        [3, 30],
      ]);
  },
} as const;

describe("MapHelper", () => {
  describe("getMapValue", (it) => {
    TEST_DATA.GET_CASES.forEach(({ name, key, expected }) => {
      it(name, ({ expect }) => {
        expect(getMapValue(makeMap(), key)).toBe(expected);
      });
    });

    it("should read a value from an immutable Map", ({ expect }) => {
      const immutableMap = makeImmutableMap();

      expect(getMapValue(immutableMap, "b")).toBe(2);
      expect(getMapValue(immutableMap, "z")).toBeUndefined();
    });

    it("should accept any string at the call site (the key-base widening)", ({
      expect,
    }) => {
      const map = makeMap();
      const { NON_KEY } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, NON_KEY)).toBeUndefined();

      expectTypeOf(getMapValue(map, NON_KEY)).toEqualTypeOf<
        MapValue<typeof map> | undefined
      >();
    });

    it("should narrow the return to the value type for a known key", ({
      expect,
    }) => {
      const map = makeLiteralMap();

      expect(getMapValue(map, "a")).toBe(1);

      expectTypeOf(getMapValue(map, "a")).toEqualTypeOf<MapValue<typeof map>>();
    });

    it("should widen the return to value-or-undefined for an arbitrary string", ({
      expect,
    }) => {
      const map = makeLiteralMap();
      const { NON_KEY } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, NON_KEY)).toBeUndefined();

      expectTypeOf(getMapValue(map, NON_KEY)).toEqualTypeOf<
        MapValue<typeof map> | undefined
      >();
    });

    it("should return the fallback when the key is absent", ({ expect }) => {
      const { FALLBACK, NON_KEY } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(makeMap(), NON_KEY, FALLBACK)).toBe(FALLBACK);
    });

    it("should return the mapped value, not the fallback, when the key is present", ({
      expect,
    }) => {
      expect(getMapValue(makeMap(), "a", TEST_DATA.TYPE_TEST.FALLBACK)).toBe(1);
    });

    it("should return a stored undefined value, not the fallback, for a present key", ({
      expect,
    }) => {
      const map = TEST_DATA.makeMapWithUndefined();
      const { FALLBACK } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, "present", FALLBACK)).toBeUndefined();

      expectTypeOf(getMapValue(map, "present", FALLBACK)).toEqualTypeOf<
        MapValue<typeof map> | typeof FALLBACK
      >();
    });

    it("should fold the fallback type into the return and drop undefined", ({
      expect,
    }) => {
      const map = makeMap();
      const { FALLBACK, NON_KEY } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, NON_KEY, FALLBACK)).toBe(FALLBACK);

      expectTypeOf(getMapValue(map, NON_KEY, FALLBACK)).toEqualTypeOf<
        MapValue<typeof map> | typeof FALLBACK
      >();
    });

    it("should support number-keyed maps and an arbitrary number key", ({
      expect,
    }) => {
      const map = TEST_DATA.makeNumberMap();
      const arbitraryKey = castAsType<number>(1);

      expect(getMapValue(map, 1)).toBe(10);

      expectTypeOf(getMapValue(map, 1)).toEqualTypeOf<MapValue<typeof map>>();

      expect(getMapValue(map, arbitraryKey)).toBe(10);

      expectTypeOf(getMapValue(map, arbitraryKey)).toEqualTypeOf<
        MapValue<typeof map> | undefined
      >();
    });

    it("should support symbol-keyed maps", ({ expect }) => {
      const presentKey = Symbol("present");
      const absentKey = castAsType<symbol>(Symbol("absent"));
      const map = new Map<symbol, number>([[presentKey, 7]]);
      const { FALLBACK } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, presentKey)).toBe(7);

      expectTypeOf(getMapValue(map, presentKey)).toEqualTypeOf<
        MapValue<typeof map>
      >();

      expect(getMapValue(map, absentKey, FALLBACK)).toBe(FALLBACK);

      expectTypeOf(getMapValue(map, absentKey, FALLBACK)).toEqualTypeOf<
        MapValue<typeof map> | typeof FALLBACK
      >();
    });
  });
});
