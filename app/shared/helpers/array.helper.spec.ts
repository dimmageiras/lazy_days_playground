import { VitestSetup } from "@configs/vitest/setup";
import { Map, Set } from "immutable";
import { describe } from "vitest";

import { ArrayHelper } from "./array.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("array.helper");

const { isArray } = ArrayHelper;

const makeArguments = function (this: void, args: unknown) {
  return args;
};

const TEST_DATA = {
  ARRAY_CASES: [
    { name: "should return true for a populated array", value: [1, 2, 3] },
    { name: "should return true for an empty array", value: [] },
    {
      name: "should return true for an arguments array",
      value: makeArguments([1, 2, 3]),
    },
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
      value: makeArguments({}),
    },
  ],
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
  });
});
