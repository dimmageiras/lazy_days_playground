import { createContext } from "react-router";

import type { CSPNonceContextValue } from "@shared/types/csp.type";

const cspNonceContext = createContext<CSPNonceContextValue>();

export { cspNonceContext };
