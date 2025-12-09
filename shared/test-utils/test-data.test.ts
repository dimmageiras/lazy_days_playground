import { describe } from "vitest";

import { testFunction } from "./test-data";

describe("test-data", () => {
  describe("testFunction", (it) => {
    it("returns undefined", ({ expect }) => {
      expect(testFunction()).toBeUndefined();
    });
  });
});
