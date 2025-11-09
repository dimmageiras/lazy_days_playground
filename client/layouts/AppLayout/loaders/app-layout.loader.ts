import type { Route } from "@rr/types/client/layouts/AppLayout/+types";
import type { DehydratedState } from "@tanstack/react-query";
import { data } from "react-router";

import { iconifyIconLoader } from "@client/components/IconifyIcon";
import { authRouteContext } from "@client/contexts/auth-route.context";
import type { VerifyAuthListData } from "@shared/types/generated/auth.type";

const appLayoutLoader = async ({
  context,
}: Route.LoaderArgs): Promise<
  ReturnType<
    typeof data<{
      authData: VerifyAuthListData | null;
      dehydratedState: DehydratedState;
    }>
  >
> => {
  const authData = context.get(authRouteContext);

  const { iconifyIconDehydratedState } = await iconifyIconLoader();

  return data({ authData, dehydratedState: iconifyIconDehydratedState });
};

export { appLayoutLoader };
