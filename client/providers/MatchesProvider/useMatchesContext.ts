import type { Route } from "@rr/types/client/+types/root";
import { useContext } from "react";

import { MatchesContext } from "./matches.context";

const useMatchesContext = (): Route.ComponentProps["matches"] => {
  const context = useContext(MatchesContext);

  if (context === undefined) {
    throw new Error("useMatches must be used within a MatchesProvider");
  }

  return context;
};

export { MatchesContext, useMatchesContext };
