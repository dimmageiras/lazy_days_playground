import { useOutletContext } from "react-router";

import type { ApiSecurityContextValue } from "@shared/types/api-security.type";

const useApiSecurity = (): ApiSecurityContextValue => {
  return useOutletContext<ApiSecurityContextValue>();
};

export { useApiSecurity };
