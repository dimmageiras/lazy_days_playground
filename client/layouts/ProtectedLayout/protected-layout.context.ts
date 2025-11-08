import { createContext } from "react-router";

import type { VerifyAuthListData } from "@shared/types/generated/auth.type";

const protectedAuthContext = createContext<VerifyAuthListData | null>();

export { protectedAuthContext };
