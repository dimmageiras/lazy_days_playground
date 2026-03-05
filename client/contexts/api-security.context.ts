import { createContext } from "react-router";

import type { ApiSecurityContextValue } from "@shared/types/api-security.type";

const apiSecurityContext = createContext<ApiSecurityContextValue>();

export { apiSecurityContext };
