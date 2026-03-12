import { AuthQueriesHelper } from "./helpers/auth-queries.helper";
import { useLogout } from "./mutations/useLogout.mutation";
import { useSubmitAuthFormMutation } from "./mutations/useSubmitAuthForm.mutation";

const {
  getSigninQueryOptions,
  getSignupQueryOptions,
  getVerifyAuthQueryOptions,
} = AuthQueriesHelper;

export {
  getSigninQueryOptions,
  getSignupQueryOptions,
  getVerifyAuthQueryOptions,
  useLogout,
  useSubmitAuthFormMutation,
};
