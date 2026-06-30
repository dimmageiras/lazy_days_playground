import { Map as ImmutableMap } from "immutable";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { MapValue } from "@shared/types/app/utility-types";

import { MapHelper } from "./map.helper";
import { TypeHelper } from "./type.helper";

const {
  sharedTestData: {
    COMMON_NUMBER,
    COMMON_NUMBER_DISTINCT_PAIRS_ARRAY,
    COMMON_STRING,
    COMMON_STRING_NUMBER_PAIRS_ARRAY,
    NUMBER_1,
    STRING_A,
    STRING_B,
    STRING_C,
    UNDEFINED_VALUE,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("map.helper");

const { castAsType } = TypeHelper;

const { getMapValue } = MapHelper;

const {
  makeImmutableMap,
  makeMap,
  makeMapWithUndefined,
  makeNumberMap,
  ...TEST_DATA
} = {
  GET_CASES: [
    {
      expected: NUMBER_1,
      key: STRING_A,
      name: "should return the value mapped to a present key",
    },
    {
      expected: COMMON_NUMBER,
      key: STRING_C,
      name: "should return the value mapped to another present key",
    },
    {
      expected: undefined,
      key: STRING_B,
      name: "should return undefined for an absent key",
    },
  ],
  MAP_ENTRIES: [...COMMON_STRING_NUMBER_PAIRS_ARRAY, [STRING_C, COMMON_NUMBER]],
  TYPE_TEST: {
    FALLBACK: castAsType<string>("fallback"),
    KEY: castAsType<string>(STRING_A),
    NON_KEY: castAsType<string>(STRING_B),
  },
  get makeImmutableMap() {
    return () => ImmutableMap<string, number>(this.MAP_ENTRIES);
  },
  get makeMap() {
    return () => new Map<string, number>(this.MAP_ENTRIES);
  },
  get makeMapWithUndefined() {
    return () =>
      new Map<string, number | undefined>([[COMMON_STRING, UNDEFINED_VALUE]]);
  },
  get makeNumberMap() {
    return () => new Map<number, number>(COMMON_NUMBER_DISTINCT_PAIRS_ARRAY);
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

      expect(getMapValue(immutableMap, STRING_A)).toBe(NUMBER_1);
      expect(getMapValue(immutableMap, STRING_B)).toBeUndefined();
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
      const map = makeMap();

      expect(getMapValue(map, STRING_A)).toBe(NUMBER_1);

      expectTypeOf(getMapValue(map, STRING_A)).toEqualTypeOf<
        MapValue<typeof map>
      >();
    });

    it("should widen the return to value-or-undefined for an arbitrary string", ({
      expect,
    }) => {
      const map = makeMap();
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
      expect(
        getMapValue(makeMap(), STRING_A, TEST_DATA.TYPE_TEST.FALLBACK),
      ).toBe(NUMBER_1);
    });

    it("should return a stored undefined value, not the fallback, for a present key", ({
      expect,
    }) => {
      const map = makeMapWithUndefined();
      const { FALLBACK } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, COMMON_STRING, FALLBACK)).toBeUndefined();

      expectTypeOf(getMapValue(map, COMMON_STRING, FALLBACK)).toEqualTypeOf<
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
      const map = makeNumberMap();
      const arbitraryKey: number = NUMBER_1;

      expect(getMapValue(map, NUMBER_1)).toBe(COMMON_NUMBER);

      expectTypeOf(getMapValue(map, NUMBER_1)).toEqualTypeOf<
        MapValue<typeof map>
      >();

      expect(getMapValue(map, arbitraryKey)).toBe(COMMON_NUMBER);

      expectTypeOf(getMapValue(map, arbitraryKey)).toEqualTypeOf<
        MapValue<typeof map> | undefined
      >();
    });

    it("should support symbol-keyed maps", ({ expect }) => {
      const presentKey = Symbol(STRING_A);
      const absentKey = Symbol(STRING_B);
      const map = new Map<symbol, number>([[presentKey, NUMBER_1]]);
      const { FALLBACK } = TEST_DATA.TYPE_TEST;

      expect(getMapValue(map, presentKey)).toBe(NUMBER_1);

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
