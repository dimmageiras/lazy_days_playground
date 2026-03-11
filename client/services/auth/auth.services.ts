import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";

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

const BASE_URL = `/${AUTH_BASE_URL}` as const;

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

const verifyAuth = async (): Promise<AxiosResponse<VerifyAuthListData>> => {
  const { VERIFY_AUTH } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${VERIFY_AUTH}` as const;
  const response = await axios.get<VerifyAuthListData>(url);

  return response;
};

const logout = async (
  payload: LogoutCreatePayload,
): Promise<AxiosResponse<LogoutCreateData>> => {
  const { LOGOUT } = AUTH_ENDPOINTS;

  const url = `${BASE_URL}/${LOGOUT}` as const;
  const response = await axios.post<LogoutCreateData>(url, payload);

  return response;
};

export const AuthService = {
  logout,
  signin,
  signup,
  verifyAuth,
};
