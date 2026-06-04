import { Map, Set } from "immutable";
import type { UnknownArray } from "type-fest";
import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ArrayHelper } from "./array.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("array.helper");

const { castAsType } = TypesHelper;

const { isArray } = ArrayHelper;

function makeArguments(..._args: Array<unknown>): IArguments {
  // eslint-disable-next-line prefer-rest-params -- real `arguments` is the contract under test
  return arguments;
}

const TEST_DATA = {
  ARRAY_CASES: [
    { name: "should return true for a populated array", value: [1, 2, 3] },
    { name: "should return true for an empty array", value: [] },
  ],
  NON_ARRAY_CASES: [
    { name: "should return false for a boolean", value: true },
    { name: "should return false for a Map", value: Map() },
    { name: "should return false for a number", value: 42 },
    { name: "should return false for a plain object", value: {} },
    { name: "should return false for a Set", value: Set() },
    { name: "should return false for a string", value: "hello" },
    { name: "should return false for a Uint8Array", value: new Uint8Array() },
    { name: "should return false for null", value: null },
    { name: "should return false for undefined", value: undefined },
    {
      name: "should return false for an arguments object",
      value: makeArguments(1, 2, 3),
    },
  ],
  TYPE_TEST: {
    UNKNOWN_VALUE: castAsType<unknown>([1, 2, 3]),
  },
} as const;

describe("ArrayHelper", () => {
  describe("isArray", (it) => {
    TEST_DATA.ARRAY_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(true);
      });
    });

    TEST_DATA.NON_ARRAY_CASES.forEach(({ name, value }) => {
      it(name, ({ expect }) => {
        expect(isArray(value)).toBe(false);
      });
    });

    it("should narrow the value to UnknownArray when true", ({ expect }) => {
      const { UNKNOWN_VALUE } = TEST_DATA.TYPE_TEST;

      expect(isArray(UNKNOWN_VALUE)).toBe(true);

      if (isArray(UNKNOWN_VALUE)) {
        expectTypeOf(UNKNOWN_VALUE).toEqualTypeOf<UnknownArray>();
      }
    });
  });
});
