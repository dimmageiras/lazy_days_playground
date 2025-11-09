import type { Route } from "@rr/types/client/+types/root";
import { dehydrate } from "@tanstack/react-query";

import { authRouteContext } from "@client/contexts/auth-route.context";
import { QueriesHelper } from "@client/helpers/queries.helper";
import { getVerifyAuthQueryOptions } from "@client/services/auth";
import type { VerifyAuthListData } from "@shared/types/generated/auth.type";

const appLayoutMiddleware: Route.MiddlewareFunction = async (
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

    context.set(authRouteContext, authData);

    return next();
  } catch {
    context.set(authRouteContext, null);

    return next();
  }
};

export { appLayoutMiddleware };
