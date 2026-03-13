import { dehydrate } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
import { data, redirect } from "react-router";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { ServicesHelper } from "@client/helpers/services.helper";
import { AUTH_FORM_MODES } from "@client/pages/Auth/components/AuthForm/constants/auth-form.constant";
import { ROUTES_CONSTANTS } from "@client/routes/constants/routes.constant";
import {
  getSigninQueryOptions,
  getSignupQueryOptions,
} from "@client/services/auth";
import { getCheckEmailMutationOptions } from "@client/services/user";
import type {
  CheckEmailPayload,
  CheckEmailResult,
  SigninPayload,
  SignupPayload,
} from "@client/types/auth.type";
import { AUTH_COOKIE_NAMES } from "@server/constants/auth-cookie.constant";
import type {
  SigninCreateData,
  SignupCreateData,
} from "@shared/types/generated/server/auth.type";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { PKCE_VERIFIER } = AUTH_COOKIE_NAMES;
const { SIGNIN: SIGNIN_MODE, SIGNUP: SIGNUP_MODE } = AUTH_FORM_MODES;
const { ROUTE_PATHS } = ROUTES_CONSTANTS;
const { HOME } = ROUTE_PATHS;

const { executeMutationOnServer, fetchServerData } = QueriesHelper;
const { findSetCookieHeader, setSetCookieHeader } = ServicesHelper;

const runCheckEmail = async ({
  email,
}: CheckEmailPayload): Promise<ReturnType<typeof data<CheckEmailResult>>> => {
  const options = getCheckEmailMutationOptions();
  const { data: response, queryClient } = await executeMutationOnServer<
    AxiosResponse<CheckEmailCreateData>,
    string
  >(options, email);

  if (response == null) {
    throw new Error("Check email mutation returned no data");
  }

  return data({
    defaultValues: {
      email,
      mode: response.data.exists ? SIGNIN_MODE : SIGNUP_MODE,
    },
    dehydratedState: dehydrate(queryClient, {
      shouldDehydrateMutation: () => true,
    }),
  });
};

const runSignin = async ({
  email,
  password,
}: SigninPayload): Promise<Response> => {
  const options = getSigninQueryOptions({
    email,
    password,
  });
  const queryClient = await fetchServerData([options]);
  const result = queryClient.getQueryData<AxiosResponse<SigninCreateData>>(
    options.queryKey,
  );

  if (result == null) {
    throw new Error("Signin query returned no data");
  }

  return redirect(HOME);
};

const runSignup = async ({
  confirmPassword,
  email,
  password,
}: SignupPayload): Promise<Response> => {
  const options = getSignupQueryOptions({
    confirmPassword,
    email,
    password,
  });
  const queryClient = await fetchServerData([options]);
  const result = queryClient.getQueryData<AxiosResponse<SignupCreateData>>(
    options.queryKey,
  );

  if (result == null) {
    throw new Error("Signup query returned no data");
  }

  const redirectResponse = redirect(HOME);
  const pkceCookie = findSetCookieHeader(result.headers, PKCE_VERIFIER);

  if (pkceCookie) {
    setSetCookieHeader(redirectResponse, pkceCookie);
  }

  return redirectResponse;
};

export const AuthFormSubmitActionHelper = {
  runCheckEmail,
  runSignin,
  runSignup,
};
