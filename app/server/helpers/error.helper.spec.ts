import { describe, expectTypeOf } from "vitest";

import { VitestSetup } from "@configs/vitest/setup";

import { ErrorHelper } from "./error.helper";

const {
  sharedTestData: {
    BOOLEAN_FALSE,
    BOOLEAN_TRUE,
    COMMON_NUMBER,
    COMMON_STRING,
    EMPTY_OBJECT,
    NULL_VALUE,
    UNDEFINED_VALUE,
    toUnknown,
  },
  trackLeaksInSpec,
} = VitestSetup();

trackLeaksInSpec("error.helper");

const { isErrnoException, normalizeError, toError } = ErrorHelper;

const TEST_DATA = {
  COERCION_CASES: [
    {
      expected: COMMON_STRING,
      input: COMMON_STRING,
      name: "should coerce a string",
    },
    {
      expected: `${COMMON_NUMBER}`,
      input: COMMON_NUMBER,
      name: "should coerce a number",
    },
    {
      expected: `${NULL_VALUE}`,
      input: NULL_VALUE,
      name: "should coerce null",
    },
    {
      expected: `${UNDEFINED_VALUE}`,
      input: UNDEFINED_VALUE,
      name: "should coerce undefined",
    },
    {
      expected: "[object Object]",
      input: EMPTY_OBJECT,
      name: "should coerce a plain object",
    },
  ],
  ERRNO_CASES: [
    {
      expected: BOOLEAN_TRUE,
      input: Object.assign(new Error(COMMON_STRING), { code: COMMON_STRING }),
      name: "should accept an Error carrying a string code",
    },
    {
      expected: BOOLEAN_FALSE,
      input: Object.assign(new Error(COMMON_STRING), { code: COMMON_NUMBER }),
      name: "should reject an Error whose code is not a string",
    },
    {
      expected: BOOLEAN_FALSE,
      input: new Error(COMMON_STRING),
      name: "should reject an Error with no code",
    },
    {
      expected: BOOLEAN_FALSE,
      input: COMMON_STRING,
      name: "should reject a non-Error value",
    },
    {
      expected: BOOLEAN_FALSE,
      input: { code: COMMON_STRING },
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

    it("should narrow the value to an ErrnoException when true", ({
      expect,
    }) => {
      const error = toUnknown(
        Object.assign(new Error(COMMON_STRING), { code: COMMON_STRING }),
      );

      expect(isErrnoException(error)).toBe(BOOLEAN_TRUE);

      if (isErrnoException(error)) {
        expectTypeOf(error).toEqualTypeOf<NodeJS.ErrnoException>();
      }
    });
  });

  describe("toError", (it) => {
    it("should return the same Error instance unchanged", ({ expect }) => {
      const error = new Error(COMMON_STRING);

      expect(toError(error)).toBe(error);
    });

    it("should preserve an Error subclass instance", ({ expect }) => {
      const error = new TypeError(COMMON_STRING);

      const result = toError(error);

      expect(result).toBe(error);
      expect(result).toBeInstanceOf(TypeError);
    });

    it("should coerce a symbol thrown value", ({ expect }) => {
      const result = toError(Symbol(COMMON_STRING));

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe(`Symbol(${COMMON_STRING})`);
    });

    TEST_DATA.COERCION_CASES.forEach(({ expected, input, name }) => {
      it(name, ({ expect }) => {
        const result = toError(input);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe(expected);
      });
    });
  });

  describe("normalizeError", (it) => {
    it("should map an Error to its message and stack", ({ expect }) => {
      const error = new Error(COMMON_STRING);

      expect(normalizeError(error)).toStrictEqual({
        error: error.message,
        stack: error.stack,
      });
    });

    it("should pass through an undefined stack", ({ expect }) => {
      const error = new Error(COMMON_STRING);

      Object.defineProperty(error, "stack", { value: UNDEFINED_VALUE });

      expect(normalizeError(error)).toStrictEqual({
        error: COMMON_STRING,
        stack: UNDEFINED_VALUE,
      });
    });

    it("should synthesize a stack for a non-Error value", ({ expect }) => {
      expect(typeof normalizeError(COMMON_STRING).stack).toBe("string");
    });

    TEST_DATA.COERCION_CASES.forEach(({ expected, input, name }) => {
      it(name, ({ expect }) => {
        expect(normalizeError(input).error).toBe(expected);
      });
    });
  });
});
