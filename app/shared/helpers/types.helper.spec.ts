import { VitestSetup } from "@configs/vitest/setup";
import { describe, expectTypeOf } from "vitest";

import { TypesHelper } from "./types.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("types.helper");

const { castAsType } = TypesHelper;

const TEST_DATA = {
  CASES: [
    { input: null, name: "should preserve a null value at runtime" },
    { input: undefined, name: "should preserve an undefined value at runtime" },
    { input: 42, name: "should preserve a primitive number" },
    {
      input: { a: 1 },
      name: "should preserve object reference identity",
    },
    {
      input: [1, 2, 3],
      name: "should preserve array reference identity",
    },
  ],
} as const;

describe("TypesHelper", () => {
  describe("castAsType", (it) => {
    TEST_DATA.CASES.forEach(({ name, input }) => {
      it(name, ({ expect }) => {
        const result = castAsType<string>(input);

        expectTypeOf(result).toEqualTypeOf<string>();
        expect(result).toBe(input);
      });
    });
  });
});
