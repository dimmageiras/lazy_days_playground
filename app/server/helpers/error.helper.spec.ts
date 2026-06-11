import { describe } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ErrorHelper } from "./error.helper";

const { trackLeaksInSpec } = VitestSetup();

trackLeaksInSpec("error.helper");

const { isErrnoException, normalizeError, toError } = ErrorHelper;

const TEST_DATA = {
  COERCED_VALUE_CASES: [
    {
      expected: "boom",
      input: "boom",
      name: "should coerce a string thrown value",
    },
    {
      expected: "null",
      input: null,
      name: "should coerce a null thrown value",
    },
    {
      expected: "undefined",
      input: undefined,
      name: "should coerce an undefined thrown value",
    },
    {
      expected: "42",
      input: 42,
      name: "should coerce a numeric thrown value",
    },
    {
      expected: "[object Object]",
      input: {},
      name: "should coerce a plain-object thrown value",
    },
    {
      expected: "Symbol(x)",
      input: Symbol("x"),
      name: "should coerce a symbol thrown value",
    },
  ],
  ERRNO_CASES: [
    {
      expected: true,
      input: Object.assign(new Error("x"), { code: "EADDRINUSE" }),
      name: "should accept an Error carrying a string code",
    },
    {
      expected: false,
      input: Object.assign(new Error("x"), { code: 42 }),
      name: "should reject an Error whose code is not a string",
    },
    {
      expected: false,
      input: new Error("x"),
      name: "should reject a plain Error with no code",
    },
    {
      expected: false,
      input: "boom",
      name: "should reject a non-Error value",
    },
    {
      expected: false,
      input: { code: "EADDRINUSE" },
      name: "should reject a plain object carrying a code",
    },
  ],
} as const;

describe("ErrorHelper", () => {
  describe("isErrnoException", (it) => {
    TEST_DATA.ERRNO_CASES.forEach(({ expected, input, name }) => {
      it(name, ({ expect }) => {
        expect(isErrnoException(input)).toBe(expected);
      });
    });
  });

  describe("toError", (it) => {
    it("should return the same Error instance unchanged", ({ expect }) => {
      const error = new Error("boom");

      expect(toError(error)).toBe(error);
    });

    it("should preserve an Error subclass instance", ({ expect }) => {
      const error = new TypeError("wrong type");

      const result = toError(error);

      expect(result).toBe(error);
      expect(result).toBeInstanceOf(TypeError);
    });

    TEST_DATA.COERCED_VALUE_CASES.forEach(({ expected, input, name }) => {
      it(name, ({ expect }) => {
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe(expected);
      });
    });
  });

  describe("normalizeError", (it) => {
    it("should map an Error to its message and stack", ({ expect }) => {
      const error = new Error("boom");

      expect(normalizeError(error)).toStrictEqual({
        error: error.message,
        stack: error.stack,
      });
    });

    it("should pass through an undefined stack", ({ expect }) => {
      const error = new Error("boom");

      Object.defineProperty(error, "stack", { value: undefined });

      expect(normalizeError(error)).toStrictEqual({
        error: "boom",
        stack: undefined,
      });
    });

    it("should carry a synthesized stack for a non-Error value", ({
      expect,
    }) => {
      expect(typeof normalizeError("boom").stack).toBe("string");
    });

    TEST_DATA.COERCED_VALUE_CASES.forEach(({ expected, input, name }) => {
      it(name, ({ expect }) => {
        expect(normalizeError(input).error).toBe(expected);
      });
    });
  });
});
