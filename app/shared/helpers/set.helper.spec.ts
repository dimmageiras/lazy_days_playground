import { VitestSetup } from "@configs/vitest/setup";
import { Set as ImmutableSet } from "immutable";
import { describe, expectTypeOf } from "vitest";

import type { SetValue } from "@shared/types/app/utility-types";

import { SetHelper } from "./set.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("set.helper");

const { castAsType } = TypesHelper;

const { addValuesInPlace, hasSetValue, stripValuesInPlace } = SetHelper;

const TEST_DATA = {
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
      values: [],
    },
  ],
  DELETE_CASES: [
    {
      expectedSize: 2,
      name: "should remove a value present in the set",
      values: ["a"],
    },
    {
      expectedSize: 2,
      name: "should be a no-op for a value absent from the set",
      values: ["a", "z"],
    },
    {
      expectedSize: 3,
      name: "should be a no-op for an empty values array",
      values: [],
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
  TYPE_TEST: {
    MEMBER: castAsType<string>("a"),
    NON_MEMBER: castAsType<string>("x"),
  },
  get IMMUTABLE_SET() {
    return ImmutableSet(["a", "b", "c"]);
  },
  get SET() {
    return new Set(["a", "b", "c"]);
  },
} as const;

describe("SetHelper", () => {
  describe("addValuesInPlace", (it) => {
    TEST_DATA.ADD_CASES.forEach(({ name, values, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = TEST_DATA.SET;

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
        expect(hasSetValue(TEST_DATA.SET, value)).toBe(expected);
      });
    });

    it("should resolve membership for an immutable Set", ({ expect }) => {
      const { IMMUTABLE_SET } = TEST_DATA;

      expect(hasSetValue(IMMUTABLE_SET, "a")).toBe(true);
      expect(hasSetValue(IMMUTABLE_SET, "d")).toBe(false);
    });

    it("should accept any string at the call site (the (PropertyKey & {}) widening)", ({
      expect,
    }) => {
      expect(hasSetValue(TEST_DATA.SET, TEST_DATA.TYPE_TEST.NON_MEMBER)).toBe(
        false,
      );
    });

    it("should narrow the value to the set's element type when true", () => {
      const { MEMBER } = TEST_DATA.TYPE_TEST;

      if (hasSetValue(TEST_DATA.SET, MEMBER)) {
        expectTypeOf(MEMBER).toEqualTypeOf<SetValue<typeof TEST_DATA.SET>>();
      }
    });
  });

  describe("stripValuesInPlace", (it) => {
    TEST_DATA.DELETE_CASES.forEach(({ name, values, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = TEST_DATA.SET;

        stripValuesInPlace(set, values);

        values.forEach((value) => {
          expect(set.has(value)).toBe(false);
        });
        expect(set.size).toBe(expectedSize);
      });
    });
  });
});
