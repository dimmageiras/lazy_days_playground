import { Set as ImmutableSet } from "immutable";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import type { SetValue } from "@shared/types/app/utility-types";

import { SetHelper } from "./set.helper";
import { TypesHelper } from "./types.helper";

const {
  sharedTestData: { EMPTY_ARRAY },
  trackLeaksInSpec,
} = await VitestSetup();

trackLeaksInSpec("set.helper");

const { castAsType } = TypesHelper;

const { addValuesInPlace, hasSetValue, stripValuesInPlace } = SetHelper;

const { makeImmutableSet, makeSet, ...TEST_DATA } = {
  ADD_CASES: [
    {
      expectedSize: 4,
      name: "should add a value absent from the set",
      values: ["w"],
    },
    {
      expectedSize: 3,
      name: "should keep an already-present value present without growing",
      values: ["a"],
    },
    {
      expectedSize: 5,
      name: "should add several absent values in one call",
      values: ["w", "x"],
    },
    {
      expectedSize: 3,
      name: "should be a no-op for an empty values array",
      values: EMPTY_ARRAY,
    },
  ],
  DELETE_CASES: [
    {
      expectedSize: 2,
      name: "should remove a value present in the set",
      values: ["a"],
    },
    {
      expectedSize: 3,
      name: "should be a no-op for a value absent from the set",
      values: ["z"],
    },
    {
      expectedSize: 2,
      name: "should remove the present value and ignore the absent one in the same call",
      values: ["a", "z"],
    },
    {
      expectedSize: 3,
      name: "should be a no-op for an empty values array",
      values: EMPTY_ARRAY,
    },
  ],
  MEMBERSHIP_CASES: [
    {
      expected: true,
      name: "should return true for a value present in the set",
      value: "a",
    },
    {
      expected: false,
      name: "should return false for a value absent from the set",
      value: "d",
    },
  ],
  SET_ELEMENTS: ["a", "b", "c"],
  TYPE_TEST: {
    MEMBER: castAsType<string>("a"),
    NON_MEMBER: castAsType<string>("x"),
  },
  get makeImmutableSet() {
    return () => ImmutableSet<string>(this.SET_ELEMENTS);
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
          expect(set.has(value)).toBe(true);
        });
        expect(set.size).toBe(expectedSize);
      });
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

      expect(hasSetValue(immutableSet, "a")).toBe(true);
      expect(hasSetValue(immutableSet, "d")).toBe(false);
    });

    it("should accept any string at the call site (the element-base widening)", ({
      expect,
    }) => {
      expect(hasSetValue(makeSet(), TEST_DATA.TYPE_TEST.NON_MEMBER)).toBe(
        false,
      );
    });

    it("should narrow the value to the set's element type when true", ({
      expect,
    }) => {
      const { MEMBER } = TEST_DATA.TYPE_TEST;
      const set = makeSet();

      expect(hasSetValue(set, MEMBER)).toBe(true);

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
          expect(set.has(value)).toBe(false);
        });
        const strippedValues: ReadonlyArray<string> = values;

        TEST_DATA.SET_ELEMENTS.filter(
          (element) => !strippedValues.includes(element),
        ).forEach((survivor) => {
          expect(set.has(survivor)).toBe(true);
        });
        expect(set.size).toBe(expectedSize);
      });
    });

    it("should constrain both mutators to the set's element type at the call site", ({
      expect,
    }) => {
      const set = makeSet();
      const { NON_MEMBER } = TEST_DATA.TYPE_TEST;

      addValuesInPlace(set, [NON_MEMBER]);
      stripValuesInPlace(set, [NON_MEMBER]);

      expect(set.size).toBe(TEST_DATA.SET_ELEMENTS.length);

      expectTypeOf(addValuesInPlace<Set<string>>)
        .parameter(1)
        .toEqualTypeOf<ReadonlyArray<string>>();
      expectTypeOf(stripValuesInPlace<Set<string>>)
        .parameter(1)
        .toEqualTypeOf<ReadonlyArray<string>>();
    });
  });
});
