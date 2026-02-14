import { describe } from "vitest";

import { StringUtilsHelper } from "./string-utils.helper";

const { safeCamelCase, toUpperCase } = StringUtilsHelper;

// Test data constants
const TEST_DATA = {
  BASIC: "hello world",
  SNAKE: "user_id",
} as const;

describe("StringUtilsHelper", () => {
  describe("safeCamelCase", (it) => {
    it("should convert a string to camelCase", ({ expect }) => {
      const result = safeCamelCase(TEST_DATA.BASIC);

      expect(result).toBe("helloWorld");
    });

    it("should convert snake case to camelCase", ({ expect }) => {
      const result = safeCamelCase(TEST_DATA.SNAKE);

      expect(result).toBe("userId");
    });
  });

  describe("toUpperCase", (it) => {
    it("should convert a string to uppercase", ({ expect }) => {
      const result = toUpperCase(TEST_DATA.BASIC);

      expect(result).toBe("HELLO WORLD");
    });
  });
});
