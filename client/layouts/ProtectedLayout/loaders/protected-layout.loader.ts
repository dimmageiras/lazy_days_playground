import type { Route } from "@rr/types/client/+types/root";
import { redirect } from "react-router";

import { authRouteContext } from "@client/contexts/auth-route.context";

const protectedLayoutLoader = async ({
  request,
  context,
}: Route.LoaderArgs): Promise<Response | void> => {
  const authData = context.get(authRouteContext);

  if (authData?.identity_id) {
    return;
  }

  const url = new URL(request.url);
  const redirectTo = url.pathname + url.search;

  return redirect(`/auth?redirect=${encodeURIComponent(redirectTo)}`);
};

export { protectedLayoutLoader };
