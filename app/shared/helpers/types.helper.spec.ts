import { VitestSetup } from "@configs/vitest/setup";
import { describe, expectTypeOf } from "vitest";

import { TypesHelper } from "./types.helper";

const { trackEndStateAfterEach } = VitestSetup();

trackEndStateAfterEach("types.helper");

const { castAsType } = TypesHelper;

describe("TypesHelper", () => {
  describe("castAsType", (it) => {
    it("should retype the value at compile time without altering the runtime value", ({
      expect,
    }) => {
      const result = castAsType<string>(null);

      expectTypeOf(result).toEqualTypeOf<string>();
      expect(result).toBeNull();
    });
  });
});
