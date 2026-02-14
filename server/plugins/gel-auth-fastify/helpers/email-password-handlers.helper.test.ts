import type { Auth } from "@gel/auth-core";
import type { KeyAsString } from "type-fest";
import type { TestAPI } from "vitest";
import { beforeEach, describe, vi } from "vitest";

import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

import { EmailPasswordHandlersHelper } from "./email-password-handlers.helper";

const { getEmailPasswordHandlers } = EmailPasswordHandlersHelper;
const { getObjectKeys } = ObjectUtilsHelper;
const { castAsType } = TypeHelper;

// Test data constants
const TEST_DATA = {
  EMAIL: "test@example.com",
  CREDS_VALUE: "test_creds",
  VERIFY_URL: "https://example.com/verify",
  VERIFICATION_TOKEN: "verification_token_123",
  VERIFIER: "verifier_code_456",
  SIGNIN_RESULT: { id: "user_1", email: "test@example.com" },
  SIGNUP_RESULT: { id: "user_2", email: "test@example.com" },
  VERIFY_RESULT: { verified: true, email: "test@example.com" },
} as const;

// Test case mappings for data-driven tests
const HANDLER_TEST_CASES = {
  SIGNIN: {
    handlerName: "signin",
    params: [TEST_DATA.EMAIL, TEST_DATA.CREDS_VALUE],
    mockMethod: "signinWithEmailPassword",
    expectedResult: TEST_DATA.SIGNIN_RESULT,
  },
  SIGNUP: {
    handlerName: "signup",
    params: [TEST_DATA.EMAIL, TEST_DATA.CREDS_VALUE, TEST_DATA.VERIFY_URL],
    mockMethod: "signupWithEmailPassword",
    expectedResult: TEST_DATA.SIGNUP_RESULT,
  },
  VERIFY_REGISTRATION: {
    handlerName: "verifyRegistration",
    params: [TEST_DATA.VERIFICATION_TOKEN, TEST_DATA.VERIFIER],
    mockMethod: "verifyEmailPasswordSignup",
    expectedResult: TEST_DATA.VERIFY_RESULT,
  },
} as const;

// Factory function to create a mock Auth core with handlers
const createMockAuthCore = () => ({
  signinWithEmailPassword: vi.fn(
    async (_email: string, _password: string) => TEST_DATA.SIGNIN_RESULT,
  ),
  signupWithEmailPassword: vi.fn(
    async (_email: string, _password: string, _verifyUrl: string) =>
      TEST_DATA.SIGNUP_RESULT,
  ),
  verifyEmailPasswordSignup: vi.fn(
    async (_verificationToken: string, _verifier: string) =>
      TEST_DATA.VERIFY_RESULT,
  ),
});

// Test helper function to test handler calls
const testHandlerCall = (
  key: KeyAsString<typeof HANDLER_TEST_CASES>,
  it: TestAPI,
) => {
  const testCase = Reflect.get(HANDLER_TEST_CASES, key);
  const { handlerName, params, mockMethod, expectedResult } = testCase;

  it(`should call ${mockMethod} with correct parameters`, async ({
    expect,
  }) => {
    const mockAuthCore = createMockAuthCore();
    const corePromise = Promise.resolve(castAsType<Auth>(mockAuthCore));

    const handlers = getEmailPasswordHandlers(corePromise);
    const handlerFn = castAsType<(...args: unknown[]) => Promise<unknown>>(
      Reflect.get(handlers, handlerName),
    );
    const result = await handlerFn(...params);

    const mockFn = Reflect.get(mockAuthCore, mockMethod);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(...params);
    expect(result).toEqual(expectedResult);
  });
};

describe("EmailPasswordHandlersHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handlers", (it) => {
    getObjectKeys(HANDLER_TEST_CASES).forEach((key) =>
      testHandlerCall(key, it),
    );
  });

  describe("handler async behavior", (it) => {
    it("should wait for core promise resolution before calling handlers", async ({
      expect,
    }) => {
      const mockAuthCore = createMockAuthCore();
      let resolveCore: (value: Auth) => void;
      const corePromise = new Promise<Auth>((resolve) => {
        resolveCore = resolve;
      });

      const handlers = getEmailPasswordHandlers(corePromise);

      // Start the handler call, but don't await yet
      const signinPromise = handlers.signin(
        TEST_DATA.EMAIL,
        TEST_DATA.CREDS_VALUE,
      );

      // Verify the handler wasn't called immediately
      expect(mockAuthCore.signinWithEmailPassword).not.toHaveBeenCalled();

      // Resolve the core promise
      resolveCore!(castAsType<Auth>(mockAuthCore));

      // Now the handler should be called
      await signinPromise;

      expect(mockAuthCore.signinWithEmailPassword).toHaveBeenCalledTimes(1);
    });
  });
});
