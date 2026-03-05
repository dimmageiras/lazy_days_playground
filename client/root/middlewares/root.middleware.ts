import type { Route } from "@rr/types/client/+types/root";

import { apiSecurityContext } from "@client/contexts/api-security.context";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { CSPNonceType } from "@shared/types/api-security.type";

const rootMiddleware: Route.MiddlewareFunction = async (
  args: Parameters<Route.MiddlewareFunction>[0],
): Promise<void> => {
  const { castAsType } = TypeHelper;

  const { _cspNonce: cspNonce, _csrfToken: csrfToken } = castAsType<
    typeof args.context & {
      _cspNonce: CSPNonceType;
      _csrfToken: string;
    }
  >(args.context);

  args.context.set(apiSecurityContext, { cspNonce, csrfToken });
};

export { rootMiddleware };
