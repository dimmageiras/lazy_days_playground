import { useSignin } from "./mutations/useSignin.mutation";
import { useSignup } from "./mutations/useSignup.mutation";
import { AuthQueriesHelper } from "./queries/helpers/auth-queries.helper";
import { useVerifyAuth } from "./queries/useVerifyAuth.query";

const { getVerifyAuthQueryOptions } = AuthQueriesHelper;

export { getVerifyAuthQueryOptions, useSignin, useSignup, useVerifyAuth };
