import axios from "axios";

import { AUTH_ENDPOINTS } from "@shared/constants/auth.constant";
import { AUTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  SigninCreateData,
  SigninCreatePayload,
  SignupCreateData,
  SignupCreatePayload,
  VerifyAuthListData,
} from "@shared/types/generated/auth.type";

const { SIGNIN, SIGNUP, VERIFY_AUTH } = AUTH_ENDPOINTS;
const BASE_URL = `/${AUTH_BASE_URL}` as const;

const signin = async (
  payload: SigninCreatePayload
): Promise<SigninCreateData> => {
  const url = `${BASE_URL}/${SIGNIN}` as const;
  const response = await axios.post<SigninCreateData>(url, payload);

  return response.data;
};

const signup = async (
  payload: SignupCreatePayload
): Promise<SignupCreateData> => {
  const url = `${BASE_URL}/${SIGNUP}` as const;
  const response = await axios.post<SignupCreateData>(url, payload);

  return response.data;
};

const verifyAuth = async (): Promise<VerifyAuthListData> => {
  const url = `${BASE_URL}/${VERIFY_AUTH}` as const;

  const response = await axios.get<VerifyAuthListData>(url);

  return response.data;
};

export const AuthService = {
  signin,
  signup,
  verifyAuth,
};
