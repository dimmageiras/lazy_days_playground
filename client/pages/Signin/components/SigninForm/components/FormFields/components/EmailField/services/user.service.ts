import axios from "axios";

import { USER_ENDPOINTS } from "@shared/constants/api.constant";
import { USER_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  CheckEmailRequest,
  CheckEmailResponse,
} from "@shared/types/user.type";

const { CHECK_EMAIL } = USER_ENDPOINTS;

const BASE_URL = `/${USER_BASE_URL}` as const;

const checkEmailExists = async (email: string): Promise<CheckEmailResponse> => {
  const url = `${BASE_URL}/${CHECK_EMAIL}` as const;
  const requestBody: CheckEmailRequest = { email };

  const response = await axios.post<CheckEmailResponse>(url, requestBody);

  return response.data;
};

export const UserService = {
  checkEmailExists,
};
