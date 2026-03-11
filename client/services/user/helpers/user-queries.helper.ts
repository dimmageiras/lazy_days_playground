import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { UserService } from "@client/services/user/user.service";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { CHECK_EMAIL } = USER_QUERY_KEYS;

const getCheckEmailQueryOptions = (
  email: string,
): UseQueryOptions<
  AxiosResponse<CheckEmailCreateData>,
  Error,
  AxiosResponse<CheckEmailCreateData>,
  readonly [...typeof CHECK_EMAIL, string]
> => {
  const { checkEmailExists } = UserService;

  return queryOptions({
    queryKey: [...CHECK_EMAIL, email] as const,
    queryFn: () => checkEmailExists(email),
  });
};

export const UserQueriesHelper = {
  getCheckEmailQueryOptions,
};
