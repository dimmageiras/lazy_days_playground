import { describe, expectTypeOf } from "vitest";

import { TypeHelper } from "./type.helper";

const { castAsType } = TypeHelper;

describe("TypeHelper", () => {
  describe("castAsType", (it) => {
    it("should cast a value to a specific type", ({ expect }) => {
      const result = castAsType<string>(null);

      expectTypeOf(result).toEqualTypeOf<string>();
      expect(result).toBeNull();
    });
  });
});
