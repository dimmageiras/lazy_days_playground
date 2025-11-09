import type { Route } from "@rr/types/client/+types/root";
import { createContext } from "react";

const MatchesContext = createContext<
  Route.ComponentProps["matches"] | undefined
>(undefined);

export { MatchesContext };
