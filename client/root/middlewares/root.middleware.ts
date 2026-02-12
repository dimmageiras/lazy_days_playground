import type { Route } from "@rr/types/client/+types/root";

import { cspNonceContext } from "@client/contexts/csp-nonce.context";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { CSPNonceType } from "@shared/types/csp.type";

const rootMiddleware: Route.MiddlewareFunction = async (
  args: Parameters<Route.MiddlewareFunction>[0],
): Promise<void> => {
  const { castAsType } = TypeHelper;

  const { _cspNonce: cspNonce } = castAsType<
    typeof args.context & {
      _cspNonce: CSPNonceType;
    }
  >(args.context);

  args.context.set(cspNonceContext, { cspNonce });
};

export { rootMiddleware };
