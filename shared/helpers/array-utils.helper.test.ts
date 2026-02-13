import { describe } from "vitest";

import { ArrayUtilsHelper } from "./array-utils.helper";

const { isArray } = ArrayUtilsHelper;

describe("ArrayUtilsHelper", () => {
  describe("isArray", (it) => {
    it("should return true if the value is an array", ({ expect }) => {
      expect(isArray([])).toBe(true);
    });
  });
});
