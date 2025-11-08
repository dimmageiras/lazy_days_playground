import { createContext } from "react-router";

import type { GetAuthData } from "@shared/types/generated/auth.type";

const protectedAuthContext = createContext<GetAuthData | null>();

export { protectedAuthContext };
