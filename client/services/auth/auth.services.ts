import axios from "axios";

import { AUTH_ENDPOINTS } from "@shared/constants/auth.constant";
import { AUTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  SigninCreateData,
  SigninCreatePayload,
  SignupCreateData,
  SignupCreatePayload,
} from "@shared/types/generated/auth.type";

const { SIGNIN, SIGNUP } = AUTH_ENDPOINTS;
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

export const AuthService = {
  signin,
  signup,
};
