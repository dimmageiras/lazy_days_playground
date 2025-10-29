import type { Route } from "@rr/types/client/+types/root";
import type { JSX, PropsWithChildren } from "react";

import { MatchesContext } from "./matches.context";

interface MatchesProviderProps extends PropsWithChildren {
  matches: Route.ComponentProps["matches"];
}

const MatchesProvider = ({
  children,
  matches,
}: MatchesProviderProps): JSX.Element => {
  return (
    <MatchesContext.Provider value={matches}>
      {children}
    </MatchesContext.Provider>
  );
};

export { MatchesProvider };
