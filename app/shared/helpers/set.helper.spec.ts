import { VitestSetup } from "@configs/vitest/setup";
import { describe, expectTypeOf } from "vitest";

import type { SetValue } from "@shared/types/app/utility-types";

import { SetHelper } from "./set.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("set.helper");

const { castAsType } = TypesHelper;

const { addValuesInSet, hasSetValue, stripValuesInSet } = SetHelper;

const TEST_DATA = {
  ADD_CASES: [
    {
      expectedSize: 4,
      name: "should add a value absent from the set",
      value: "w",
    },
    {
      expectedSize: 3,
      name: "should keep an already-present value present without growing",
      value: "a",
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
  get SET() {
    return new Set(["a", "b", "c"]);
  },
} as const;

describe("SetHelper", () => {
  describe("addValuesInSet", (it) => {
    TEST_DATA.ADD_CASES.forEach(({ name, value, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = TEST_DATA.SET;

        addValuesInSet(set, [value]);

        expect(set.has(value)).toBe(true);
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

    it("should accept any string at the call site (the (string & {}) widening)", () => {
      hasSetValue(TEST_DATA.SET, TEST_DATA.TYPE_TEST.NON_MEMBER);
    });

    it("should narrow the value to the set's element type when true", () => {
      const { MEMBER } = TEST_DATA.TYPE_TEST;

      if (hasSetValue(TEST_DATA.SET, MEMBER)) {
        expectTypeOf(MEMBER).toEqualTypeOf<SetValue<typeof TEST_DATA.SET>>();
      }
    });
  });

  describe("stripValuesInSet", (it) => {
    TEST_DATA.DELETE_CASES.forEach(({ name, values, expectedSize }) => {
      it(name, ({ expect }) => {
        const set = TEST_DATA.SET;

        stripValuesInSet(set, values);

        values.forEach((value) => {
          expect(set.has(value)).toBe(false);
        });
        expect(set.size).toBe(expectedSize);
      });
    });
  });
});
