import { Set as ImmutableSet } from "immutable";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { SetValue } from "@shared/types/app/utility-types";

import { SetHelper } from "./set.helper";
import { TypeHelper } from "./type.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER_ARRAY,
    COMMON_ONE_STRING_ARRAY,
    COMMON_STRING,
    COMMON_TWO_STRING_ARRAY,
    EMPTY_ARRAY,
    NUMBER_1,
    STRING_A,
    STRING_B,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("set.helper");

const { castAsType } = TypeHelper;

const { addValuesInPlace, hasSetValue, stripValuesInPlace } = SetHelper;

const {
  makeImmutableSet,
  makeMultiSet,
  makeNumberSet,
  makeSet,
  ...TEST_DATA
} = {
  ADD_CASES: [
    {
      expectedSize: 2,
      name: "should add a value absent from the set",
      values: [STRING_B],
    },
    {
      expectedSize: 1,
      name: "should keep an already-present value present without growing",
      values: [STRING_A],
    },
    {
      expectedSize: 2,
      name: "should add several values in one call",
      values: [STRING_A, STRING_B],
    },
    {
      expectedSize: 1,
      name: "should be a no-op for an empty values array",
      values: EMPTY_ARRAY,
    },
  ],
  DELETE_CASES: [
    {
      expectedSize: 0,
      name: "should remove a value present in the set",
      values: [STRING_A],
    },
    {
      expectedSize: 1,
      name: "should be a no-op for a value absent from the set",
      values: [STRING_B],
    },
    {
      expectedSize: 0,
      name: "should remove the present value and ignore the absent one in the same call",
      values: [STRING_A, STRING_B],
    },
    {
      expectedSize: 1,
      name: "should be a no-op for an empty values array",
      values: EMPTY_ARRAY,
    },
  ],
  MEMBERSHIP_CASES: [
    {
      expected: BOOLEAN_TRUE,
      name: "should return true for a value present in the set",
      value: STRING_A,
    },
    {
      expected: BOOLEAN_FALSE,
      name: "should return false for a value absent from the set",
      value: STRING_B,
    },
  ],
  MULTI_SET_ELEMENTS: COMMON_TWO_STRING_ARRAY,
  SET_ELEMENTS: COMMON_ONE_STRING_ARRAY,
  TYPE_TEST: {
    MEMBER: castAsType<string>(STRING_A),
    NON_MEMBER: castAsType<string>(STRING_B),
  },
  get makeImmutableSet() {
    return () => ImmutableSet<string>(this.SET_ELEMENTS);
  },
  get makeMultiSet() {
    return () => new Set<string>(this.MULTI_SET_ELEMENTS);
  },
  get makeNumberSet() {
    return () => new Set<number>(COMMON_NUMBER_ARRAY);
  },
  get makeSet() {
    return () => new Set<string>(this.SET_ELEMENTS);
  },
} as const;

describe("SetHelper", () => {
  describe("addValuesInPlace", (it) => {
    TEST_DATA.ADD_CASES.forEach(({ name, values, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = makeSet();

        addValuesInPlace(set, values);

        values.forEach((value) => {
          expect(set.has(value)).toBe(BOOLEAN_TRUE);
        });
        expect(set.size).toBe(expectedSize);
      });
    });

    it("should add the new value and leave existing members intact", ({
      expect,
    }) => {
      const set = makeMultiSet();

      addValuesInPlace(set, [COMMON_STRING]);

      expect(set.has(COMMON_STRING)).toBe(BOOLEAN_TRUE);
      expect(set.has(STRING_A)).toBe(BOOLEAN_TRUE);
      expect(set.has(STRING_B)).toBe(BOOLEAN_TRUE);
      expect(set.size).toBe(TEST_DATA.MULTI_SET_ELEMENTS.length + 1);
    });

    it("should constrain the values to the set's element type", () => {
      expectTypeOf(addValuesInPlace<Set<string>>)
        .parameter(1)
        .toEqualTypeOf<ReadonlyArray<string>>();
    });
  });

  describe("hasSetValue", (it) => {
    TEST_DATA.MEMBERSHIP_CASES.forEach(({ name, value, expected }) => {
      it(name, ({ expect }) => {
        expect(hasSetValue(makeSet(), value)).toBe(expected);
      });
    });

    it("should resolve membership for an immutable Set", ({ expect }) => {
      const immutableSet = makeImmutableSet();

      expect(hasSetValue(immutableSet, STRING_A)).toBe(BOOLEAN_TRUE);
      expect(hasSetValue(immutableSet, STRING_B)).toBe(BOOLEAN_FALSE);
    });

    it("should resolve membership for a number-element Set", ({ expect }) => {
      const numberSet = makeNumberSet();

      expect(hasSetValue(numberSet, NUMBER_1)).toBe(BOOLEAN_TRUE);
    });

    it("should accept any string at the call site (the element-base widening)", ({
      expect,
    }) => {
      expect(hasSetValue(makeSet(), TEST_DATA.TYPE_TEST.NON_MEMBER)).toBe(
        BOOLEAN_FALSE,
      );
    });

    it("should narrow the value to the set's element type when true", ({
      expect,
    }) => {
      const { MEMBER } = TEST_DATA.TYPE_TEST;
      const set = makeSet();

      expect(hasSetValue(set, MEMBER)).toBe(BOOLEAN_TRUE);

      if (hasSetValue(set, MEMBER)) {
        expectTypeOf(MEMBER).toEqualTypeOf<SetValue<typeof set>>();
      }
    });
  });

  describe("stripValuesInPlace", (it) => {
    TEST_DATA.DELETE_CASES.forEach(({ name, values, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = makeSet();

        stripValuesInPlace(set, values);

        values.forEach((value) => {
          expect(set.has(value)).toBe(BOOLEAN_FALSE);
        });
        expect(set.size).toBe(expectedSize);
      });
    });

    it("should remove only the targeted values and leave the rest", ({
      expect,
    }) => {
      const set = makeMultiSet();

      stripValuesInPlace(set, [STRING_A]);

      expect(set.has(STRING_A)).toBe(BOOLEAN_FALSE);
      expect(set.has(STRING_B)).toBe(BOOLEAN_TRUE);
      expect(set.size).toBe(TEST_DATA.MULTI_SET_ELEMENTS.length - 1);
    });

    it("should constrain the values to the set's element type", () => {
      expectTypeOf(stripValuesInPlace<Set<string>>)
        .parameter(1)
        .toEqualTypeOf<ReadonlyArray<string>>();
    });
  });
});
