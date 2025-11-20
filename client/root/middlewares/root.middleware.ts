import type { Route } from "@rr/types/client/+types/root";

import { cspNonceContext } from "@client/contexts/csp-nonce.context";
import type { CSPNonceType } from "@shared/types/csp.type";

const rootMiddleware: Route.MiddlewareFunction = async (
  args: Parameters<Route.MiddlewareFunction>[0]
): Promise<void> => {
  const { _cspNonce: cspNonce } = args.context as typeof args.context & {
    _cspNonce: CSPNonceType;
  };

  args.context.set(cspNonceContext, { cspNonce });
};

export { rootMiddleware };
