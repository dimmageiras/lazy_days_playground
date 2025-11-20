import { useOutletContext } from "react-router";

import type { CSPNonceContextValue } from "@shared/types/csp.type";

const useCSPNonce = (): CSPNonceContextValue => {
  return useOutletContext<CSPNonceContextValue>();
};

export { useCSPNonce };
