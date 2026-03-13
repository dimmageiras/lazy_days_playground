import { useMutationState } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { IS_EXISTING_USER } from "@client/constants/user.constant";
import { USER_QUERY_KEYS } from "@client/services/user/user.constant";
import { StringUtilsHelper } from "@shared/helpers/string-utils.helper";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { CheckEmailCreateData } from "@shared/types/generated/server/user.type";

const { toUpperCase } = StringUtilsHelper;
const { castAsType } = TypeHelper;

interface EmailExistenceResult {
  isExistingUser: (typeof IS_EXISTING_USER)[keyof typeof IS_EXISTING_USER];
  email: string | null;
}

const useEmailExistence = (): EmailExistenceResult => {
  const { CHECK_EMAIL } = USER_QUERY_KEYS;

  const emailExistenceMutations = useMutationState({
    filters: { mutationKey: CHECK_EMAIL },
    select: (mutation) => {
      const response = castAsType<
        AxiosResponse<CheckEmailCreateData> | undefined
      >(mutation.state.data);
      const data = response?.data;

      return {
        exists: data?.exists,
        email: data?.email,
      };
    },
  });

  const latest = emailExistenceMutations.at(-1);
  const value = toUpperCase(`${latest?.exists ?? null}`);
  const isExistingUser = Reflect.get(IS_EXISTING_USER, value);

  return {
    isExistingUser,
    email: latest?.email ?? null,
  };
};

export { useEmailExistence };
