import type { Route } from "@rr/types/client/+types/root";
import { dehydrate } from "@tanstack/react-query";

import { COOKIE_KEYS } from "@client/constants/auth-cookie.constant";
import { authRouteContext } from "@client/contexts/auth-route.context";
import { ClientIdRouteContext } from "@client/contexts/client-id-route.context";
import { CookieHelper } from "@client/helpers/cookie.helper";
import { QueriesHelper } from "@client/helpers/queries.helper";
import { getVerifyAuthQueryOptions } from "@client/services/auth";
import { TIMING } from "@shared/constants/timing.constant";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { VerifyAuthListData } from "@shared/types/generated/server/auth.type";

const { CLIENT_ID } = COOKIE_KEYS;
const { MINUTES_FIVE_IN_S } = TIMING;

const { createStandardCookie, hasCookie, setCookie } = CookieHelper;
const { fetchServerData } = QueriesHelper;
const { castAsType } = TypeHelper;

const appLayoutMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const { getOrCreateClientId, hasAccessToken, run } = ClientIdRouteContext;

  const clientIdCookie = createStandardCookie(CLIENT_ID);

  return run(request, async () => {
    const hasToken = hasAccessToken();

    if (!hasToken) {
      context.set(authRouteContext, null);

      return next();
    }

    const clientId = await getOrCreateClientId(clientIdCookie);

    const cookieHeader = request.headers.get("cookie");
    const hasClientIdCookie = await hasCookie(clientIdCookie, cookieHeader);

    try {
      const queryClient = await fetchServerData([
        getVerifyAuthQueryOptions(clientId),
      ]);

      const dehydratedState = dehydrate(queryClient);
      const authData = castAsType<VerifyAuthListData | null>(
        dehydratedState.queries[0]?.state.data,
      );

      context.set(authRouteContext, authData);

      const response = await next();

      if (!hasClientIdCookie) {
        await setCookie(response, clientIdCookie, clientId, MINUTES_FIVE_IN_S);
      }

      return response;
    } catch {
      context.set(authRouteContext, null);

      const response = await next();

      if (!hasClientIdCookie) {
        await setCookie(response, clientIdCookie, clientId, MINUTES_FIVE_IN_S);
      }

      return response;
    }
  });
};

export { appLayoutMiddleware };
