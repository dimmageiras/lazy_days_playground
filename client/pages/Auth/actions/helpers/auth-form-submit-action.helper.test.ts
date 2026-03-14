import type { DehydratedState } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import type { Procedure } from "@vitest/spy";
import type { AxiosResponse } from "axios";
import type { Mock } from "vitest";
import { describe, vi } from "vitest";

import { AUTH_FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import { ROUTES_CONSTANTS } from "@client/routes/constants/routes.constant";
import { TypeHelper } from "@shared/helpers/type.helper";

import { AuthFormSubmitActionHelper } from "./auth-form-submit-action.helper";

const {
  CHECK_EMAIL: CHECK_EMAIL_MODE,
  SIGNIN: SIGNIN_MODE,
  SIGNUP: SIGNUP_MODE,
} = AUTH_FORM_MODES;
const { ROUTE_PATHS } = ROUTES_CONSTANTS;
const { HOME } = ROUTE_PATHS;

const { runCheckEmail, runSignin, runSignup } = AuthFormSubmitActionHelper;
const { castAsType } = TypeHelper;

const QUERY_KEY_CHECK_EMAIL = ["check-email"] as const;
const QUERY_KEY_SIGNIN = ["signin"] as const;
const QUERY_KEY_SIGNUP = ["signup"] as const;

const TEST_DATA = {
  CONFIRM_PASS: "password123",
  EMAIL: "test@example.com",
  MOCK_DATA_RESPONSE: new Response(),
  MOCK_REDIRECT_RESPONSE: new Response(),
  PASS: "password123",
  PKCE_COOKIE_STRING: "_pkce-verifier=abc123",
} as const;

const createMutationQueryClient = async (
  exists: boolean,
): Promise<{
  queryClient: QueryClient;
  response: AxiosResponse<{ exists: boolean }>;
}> => {
  const queryClient = new QueryClient();
  const response = castAsType<AxiosResponse<{ exists: boolean }>>({
    data: { exists },
  });
  const mutation = queryClient.getMutationCache().build(queryClient, {
    mutationKey: QUERY_KEY_CHECK_EMAIL,
    mutationFn: async () => response,
  });

  await mutation.execute(TEST_DATA.EMAIL);

  return { queryClient, response };
};

const {
  mockFetchServerData,
  mockExecuteMutationOnServer,
  mockData,
  mockRedirect,
  mockGetCheckEmailMutationOptions,
  mockGetSigninQueryOptions,
  mockGetSignupQueryOptions,
  mockFindSetCookieHeader,
  mockSetSetCookieHeader,
} = vi.hoisted(() => ({
  mockFetchServerData: vi.fn(),
  mockExecuteMutationOnServer: vi.fn(),
  mockData: vi.fn(),
  mockRedirect: vi.fn(),
  mockGetCheckEmailMutationOptions: vi.fn(),
  mockGetSigninQueryOptions: vi.fn(),
  mockGetSignupQueryOptions: vi.fn(),
  mockFindSetCookieHeader: vi.fn(),
  mockSetSetCookieHeader: vi.fn(),
}));

vi.mock("@client/helpers/queries.helper", () => ({
  QueriesHelper: {
    fetchServerData: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
      mockFetchServerData(...args),
    executeMutationOnServer: (
      ...args: unknown[]
    ): ReturnType<Mock<Procedure>> => mockExecuteMutationOnServer(...args),
  },
}));

vi.mock("react-router", () => ({
  data: (...args: unknown[]): ReturnType<Mock<Procedure>> => mockData(...args),
  redirect: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
    mockRedirect(...args),
}));

vi.mock("@client/services/auth", () => ({
  getSigninQueryOptions: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
    mockGetSigninQueryOptions(...args),
  getSignupQueryOptions: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
    mockGetSignupQueryOptions(...args),
}));

vi.mock("@client/services/user", () => ({
  getCheckEmailMutationOptions: (
    ...args: unknown[]
  ): ReturnType<Mock<Procedure>> => mockGetCheckEmailMutationOptions(...args),
}));

vi.mock("@client/helpers/services.helper", () => ({
  ServicesHelper: {
    findSetCookieHeader: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
      mockFindSetCookieHeader(...args),
    setSetCookieHeader: (...args: unknown[]): ReturnType<Mock<Procedure>> =>
      mockSetSetCookieHeader(...args),
  },
}));

describe("AuthActionHelper", () => {
  describe("runCheckEmail", (it) => {
    it("should return data with defaultValues and mode SIGNIN when email exists", async ({
      expect,
    }) => {
      const { queryClient, response } = await createMutationQueryClient(true);

      mockGetCheckEmailMutationOptions.mockReturnValue({
        mutationKey: QUERY_KEY_CHECK_EMAIL,
      });
      mockData.mockReturnValue(TEST_DATA.MOCK_DATA_RESPONSE);
      mockExecuteMutationOnServer.mockResolvedValue({
        data: response,
        queryClient,
      });

      const result = await runCheckEmail({
        email: TEST_DATA.EMAIL,
        mode: CHECK_EMAIL_MODE,
      });

      expect(mockGetCheckEmailMutationOptions).toHaveBeenCalledWith();
      expect(mockData).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultValues: {
            email: TEST_DATA.EMAIL,
            mode: SIGNIN_MODE,
          },
          dehydratedState: expect.objectContaining({
            mutations: expect.any(Array),
            queries: expect.any(Array),
          }),
        }),
      );
      expect(result).toBe(TEST_DATA.MOCK_DATA_RESPONSE);
    });

    it("should return data with defaultValues and mode SIGNUP when email does not exist", async ({
      expect,
    }) => {
      const { queryClient, response } = await createMutationQueryClient(false);

      mockData.mockReturnValue(TEST_DATA.MOCK_DATA_RESPONSE);
      mockGetCheckEmailMutationOptions.mockReturnValue({
        mutationKey: QUERY_KEY_CHECK_EMAIL,
      });
      mockExecuteMutationOnServer.mockResolvedValue({
        data: response,
        queryClient,
      });

      const result = await runCheckEmail({
        email: TEST_DATA.EMAIL,
        mode: CHECK_EMAIL_MODE,
      });

      expect(mockData).toHaveBeenCalledWith({
        defaultValues: {
          email: TEST_DATA.EMAIL,
          mode: SIGNUP_MODE,
        },
        dehydratedState: expect.objectContaining({
          mutations: expect.any(Array),
          queries: expect.any(Array),
        }),
      });
      expect(result).toBe(TEST_DATA.MOCK_DATA_RESPONSE);

      if (mockData?.mock?.calls?.[0]?.[0] == null) {
        throw new Error("Mock data calls[0][0] is null");
      }

      const { dehydratedState }: { dehydratedState: DehydratedState } =
        mockData.mock.calls[0][0];

      expect(dehydratedState.mutations).toHaveLength(1);
    });

    it("should throw when query returns no data", async ({ expect }) => {
      mockExecuteMutationOnServer.mockResolvedValue({
        data: undefined,
        queryClient: new QueryClient(),
      });

      await expect(
        runCheckEmail({
          email: TEST_DATA.EMAIL,
          mode: CHECK_EMAIL_MODE,
        }),
      ).rejects.toThrow("Check email mutation returned no data");
    });
  });

  describe("runSignin", (it) => {
    it("should return redirect to HOME when signin succeeds", async ({
      expect,
    }) => {
      mockRedirect.mockReturnValue(TEST_DATA.MOCK_REDIRECT_RESPONSE);
      mockGetSigninQueryOptions.mockReturnValue({
        queryKey: QUERY_KEY_SIGNIN,
      });

      const getQueryData = vi.fn().mockReturnValue({
        data: {},
      });

      mockFetchServerData.mockResolvedValue({ getQueryData });

      const result = await runSignin({
        email: TEST_DATA.EMAIL,
        mode: SIGNIN_MODE,
        password: TEST_DATA.PASS,
      });

      expect(mockGetSigninQueryOptions).toHaveBeenCalledWith({
        email: TEST_DATA.EMAIL,
        password: TEST_DATA.PASS,
      });
      expect(mockRedirect).toHaveBeenCalledWith(HOME);
      expect(result).toBe(TEST_DATA.MOCK_REDIRECT_RESPONSE);
    });

    it("should throw when query returns no data", async ({ expect }) => {
      const getQueryData = vi.fn().mockReturnValue(null);

      mockFetchServerData.mockResolvedValue({ getQueryData });

      await expect(
        runSignin({
          email: TEST_DATA.EMAIL,
          mode: SIGNIN_MODE,
          password: TEST_DATA.PASS,
        }),
      ).rejects.toThrow("Signin query returned no data");
    });
  });

  describe("runSignup", (it) => {
    it("should return redirect to HOME when signup succeeds", async ({
      expect,
    }) => {
      mockGetSignupQueryOptions.mockReturnValue({
        queryKey: QUERY_KEY_SIGNUP,
      });

      const getQueryData = vi.fn().mockReturnValue({
        data: {},
        headers: {},
      });

      mockFetchServerData.mockResolvedValue({ getQueryData });
      mockFindSetCookieHeader.mockReturnValue(undefined);

      const result = await runSignup({
        confirmPassword: TEST_DATA.CONFIRM_PASS,
        email: TEST_DATA.EMAIL,
        mode: SIGNUP_MODE,
        password: TEST_DATA.PASS,
      });

      expect(mockGetSignupQueryOptions).toHaveBeenCalledWith({
        confirmPassword: TEST_DATA.CONFIRM_PASS,
        email: TEST_DATA.EMAIL,
        password: TEST_DATA.PASS,
      });
      expect(mockRedirect).toHaveBeenCalledWith(HOME);
      expect(result).toBe(TEST_DATA.MOCK_REDIRECT_RESPONSE);
    });

    it("should attach PKCE cookie to redirect when present in response headers", async ({
      expect,
    }) => {
      const getQueryData = vi.fn().mockReturnValue({
        data: {},
        headers: {},
      });

      mockFetchServerData.mockResolvedValue({ getQueryData });
      mockFindSetCookieHeader.mockReturnValue(TEST_DATA.PKCE_COOKIE_STRING);

      const result = await runSignup({
        confirmPassword: TEST_DATA.CONFIRM_PASS,
        email: TEST_DATA.EMAIL,
        mode: SIGNUP_MODE,
        password: TEST_DATA.PASS,
      });

      expect(mockRedirect).toHaveBeenCalledWith(HOME);
      expect(mockFindSetCookieHeader).toHaveBeenCalled();
      expect(mockSetSetCookieHeader).toHaveBeenCalledWith(
        result,
        TEST_DATA.PKCE_COOKIE_STRING,
      );
    });

    it("should not call setSetCookieHeader when findSetCookieHeader returns undefined", async ({
      expect,
    }) => {
      const getQueryData = vi.fn().mockReturnValue({
        data: {},
        headers: {},
      });

      mockFetchServerData.mockResolvedValue({ getQueryData });
      mockFindSetCookieHeader.mockReturnValue(undefined);

      await runSignup({
        confirmPassword: TEST_DATA.CONFIRM_PASS,
        email: TEST_DATA.EMAIL,
        mode: SIGNUP_MODE,
        password: TEST_DATA.PASS,
      });

      expect(mockSetSetCookieHeader).not.toHaveBeenCalled();
    });

    it("should throw when query returns no data", async ({ expect }) => {
      const getQueryData = vi.fn().mockReturnValue(undefined);

      mockFetchServerData.mockResolvedValue({ getQueryData });

      await expect(
        runSignup({
          confirmPassword: TEST_DATA.CONFIRM_PASS,
          email: TEST_DATA.EMAIL,
          mode: SIGNUP_MODE,
          password: TEST_DATA.PASS,
        }),
      ).rejects.toThrow("Signup query returned no data");
    });
  });
});
