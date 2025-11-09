import { createContext } from "react-router";

import type { VerifyAuthListData } from "@shared/types/generated/auth.type";

const authRouteContext = createContext<VerifyAuthListData | null>();

export { authRouteContext };
