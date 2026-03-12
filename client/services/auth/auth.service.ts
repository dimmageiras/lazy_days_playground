import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

import { HTTP_STATUS } from "@server/constants/http-status.constant";
import { AUTH_ENDPOINTS } from "@shared/constants/auth.constant";
import { AUTH_BASE_URL } from "@shared/constants/base-urls.constant";
import type {
  LogoutCreateData,
  LogoutCreatePayload,
  SigninCreateData,
  SigninCreatePayload,
  SignupCreateData,
  SignupCreatePayload,
  VerifyAuthListData,
} from "@shared/types/generated/server/auth.type";

import { AUTH_ACTION_URL } from "./auth.constant";

const { ACCEPTED, OK } = HTTP_STATUS;
const IS_SUCCESS_STATUS: Set<number> = new Set([ACCEPTED, OK]);

const BASE_URL = `/${AUTH_BASE_URL}` as const;

const logout = async (
  payload: LogoutCreatePayload,
): Promise<AxiosResponse<LogoutCreateData>> => {
  const { LOGOUT } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${LOGOUT}` as const;
  const response = await axios.post<LogoutCreateData>(url, payload);

  return response;
};

const signin = async (
  payload: SigninCreatePayload,
): Promise<AxiosResponse<SigninCreateData>> => {
  const { SIGNIN } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${SIGNIN}` as const;
  const response = await axios.post<SigninCreateData>(url, payload);

  return response;
};

const signup = async (
  payload: SignupCreatePayload,
  config?: AxiosRequestConfig,
): Promise<AxiosResponse<SignupCreateData>> => {
  const { SIGNUP } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${SIGNUP}` as const;
  const response = await axios.post<SignupCreateData>(url, payload, config);

  return response;
};

const submitAuthForm = async ({
  formData,
}: {
  formData: FormData;
}): Promise<AxiosResponse<(Record<string, unknown> | string)[]>> => {
  const response = await axios.post<(Record<string, unknown> | string)[]>(
    AUTH_ACTION_URL,
    formData,
    {
      maxRedirects: 0,
      validateStatus: (status) => IS_SUCCESS_STATUS.has(status),
      withCredentials: true,
    },
  );

  return response;
};

const verifyAuth = async (): Promise<AxiosResponse<VerifyAuthListData>> => {
  const { VERIFY_AUTH } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${VERIFY_AUTH}` as const;
  const response = await axios.get<VerifyAuthListData>(url);

  return response;
};

export const AuthService = {
  logout,
  signin,
  signup,
  submitAuthForm,
  verifyAuth,
};
