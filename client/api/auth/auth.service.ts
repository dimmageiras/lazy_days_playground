import axios from "axios";

import { AUTH_ENDPOINTS } from "@shared/constants/api.constant";
import { AUTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  SigninRequest,
  SigninResponse,
  SignupRequest,
  SignupResponse,
  VerifyRequest,
  VerifyResponse,
} from "@shared/types/auth.type";

const { SIGNIN, SIGNUP, VERIFY } = AUTH_ENDPOINTS;

const BASE_URL = `/${AUTH_BASE_URL}` as const;

const signin = async (data: SigninRequest): Promise<SigninResponse> => {
  const url = `${BASE_URL}/${SIGNIN}` as const;
  const response = await axios.post<SigninResponse>(url, data);

  return response.data;
};

const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const url = `${BASE_URL}/${SIGNUP}` as const;
  const response = await axios.post<SignupResponse>(url, data);

  return response.data;
};

const verify = async (data: VerifyRequest): Promise<VerifyResponse> => {
  const url = `${BASE_URL}/${VERIFY}` as const;
  const response = await axios.post<VerifyResponse>(url, data);

  return response.data;
};

export const AuthService = {
  signin,
  signup,
  verify,
};
