import type { Route } from "@rr/types/client/+types/root";

import { cspNonceContext } from "@client/contexts/csp-nonce.context";
import type { CSPNonceContextValue } from "@shared/types/csp.type";

const rootLoader = async ({
  context,
}: Route.LoaderArgs): Promise<CSPNonceContextValue> => {
  const { cspNonce }: CSPNonceContextValue = context.get(cspNonceContext);

  return {
    cspNonce,
  };
};

export { rootLoader };
