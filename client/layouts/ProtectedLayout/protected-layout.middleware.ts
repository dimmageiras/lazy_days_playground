import type { Route } from "@rr/types/client/+types/root";
import { dehydrate } from "@tanstack/react-query";
import { redirect } from "react-router";

import { QueriesHelper } from "@client/helpers/queries.helper";
import { getVerifyAuthQueryOptions } from "@client/services/auth";
import type { VerifyAuthListData } from "@shared/types/generated/auth.type";

import { protectedAuthContext } from "./protected-layout.context";

const protectedLayoutMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next
) => {
  const { fetchServerData } = QueriesHelper;

  try {
    const queryClient = await fetchServerData([
      getVerifyAuthQueryOptions(request),
    ]);

    const dehydratedState = dehydrate(queryClient);
    const authData = dehydratedState.queries[0]?.state
      .data as VerifyAuthListData | null;

    context.set(protectedAuthContext, authData);

    return next();
  } catch {
    const url = new URL(request.url);
    const redirectTo = url.pathname + url.search;

    return redirect(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
  }
};

export { protectedLayoutMiddleware };
