import type { Route } from "@rr/types/client/+types/root";

import { apiSecurityContext } from "@client/contexts/api-security.context";
import type { ApiSecurityContextValue } from "@shared/types/api-security.type";

const rootLoader = async ({
  context,
}: Route.LoaderArgs): Promise<ApiSecurityContextValue> => {
  const { cspNonce, csrfToken }: ApiSecurityContextValue =
    context.get(apiSecurityContext);

  return { cspNonce, csrfToken };
};

export { rootLoader };
