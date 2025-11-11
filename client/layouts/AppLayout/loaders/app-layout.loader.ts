import type { Route } from "@rr/types/client/layouts/AppLayout/+types";
import type { DehydratedState } from "@tanstack/react-query";
import { data } from "react-router";

import { iconifyIconLoader } from "@client/components/IconifyIcon";
import { authRouteContext } from "@client/contexts/auth-route.context";
import { ClientIdRouteContext } from "@client/contexts/client-id-route.context";
import { CookieHelper } from "@client/helpers/cookie.helper";

const appLayoutLoader = async ({
  context,
}: Route.LoaderArgs): Promise<
  ReturnType<
    typeof data<{
      clientId: string | null;
      dehydratedState: DehydratedState;
      isAuthenticated: boolean;
    }>
  >
> => {
  const { getClientId } = ClientIdRouteContext;
  const { createStandardCookie } = CookieHelper;

  const authData = context.get(authRouteContext);
  const clientIdCookie = createStandardCookie("client-id");
  const clientId = await getClientId(clientIdCookie);

  const isAuthenticated = !!authData?.identity_id;

  const { iconifyIconDehydratedState } = await iconifyIconLoader();

  return data({
    clientId,
    dehydratedState: iconifyIconDehydratedState,
    isAuthenticated,
  });
};

export { appLayoutLoader };
