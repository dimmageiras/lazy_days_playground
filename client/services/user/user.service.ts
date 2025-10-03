import axios from "axios";

import { USER_BASE_URL } from "@shared/constants/base-urls.const";
import { USER_ENDPOINTS } from "@shared/constants/user.constant";
import type {
  CheckEmailCreateData,
  CheckEmailCreatePayload,
} from "@shared/types/generated/user.type";

const { CHECK_EMAIL } = USER_ENDPOINTS;

const BASE_URL = `/${USER_BASE_URL}` as const;

const checkEmailExists = async (
  email: string
): Promise<CheckEmailCreateData> => {
  const url = `${BASE_URL}/${CHECK_EMAIL}` as const;
  const requestBody: CheckEmailCreatePayload = { email };

  const response = await axios.post<CheckEmailCreateData>(url, requestBody);

  return response.data;
};

export const UserService = {
  checkEmailExists,
};
