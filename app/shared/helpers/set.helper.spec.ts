import { VitestSetup } from "@configs/vitest/setup";
import { Set } from "immutable";
import { describe, expectTypeOf } from "vitest";

import type { SetValue } from "@shared/types/app/utility-types";

import { SetHelper } from "./set.helper";
import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("set.helper");

const { castAsType } = TypesHelper;

const { hasSetValue } = SetHelper;

const TEST_DATA = {
  MEMBERSHIP_CASES: [
    {
      name: "should return true for a value present in the set",
      value: "a",
      expected: true,
    },
    {
      name: "should return false for a value absent from the set",
      value: "d",
      expected: false,
    },
  ],
  get SET() {
    return Set(["a", "b", "c"] as const);
  },
  TYPE_TEST: {
    MEMBER: castAsType<string>("a"),
    NON_MEMBER: castAsType<string>("x"),
  },
} as const;

describe("SetHelper", () => {
  describe("hasSetValue", (it) => {
    TEST_DATA.MEMBERSHIP_CASES.forEach(({ name, value, expected }) => {
      it(name, ({ expect }) => {
        const result = hasSetValue(TEST_DATA.SET, value);

        expect(result).toBe(expected);
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
});
