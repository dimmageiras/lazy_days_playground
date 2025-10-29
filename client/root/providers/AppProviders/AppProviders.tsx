import type { Route } from "@rr/types/client/+types/root";
import type { JSX, PropsWithChildren } from "react";

import { MatchesProvider } from "@client/providers/MatchesProvider";
import { QueryProvider } from "@client/providers/QueryProvider";

interface AppProvidersProps extends PropsWithChildren {
  matches: Route.ComponentProps["matches"];
}

const AppProviders = ({
  children,
  matches,
}: AppProvidersProps): JSX.Element => {
  return (
    <MatchesProvider matches={matches}>
      <QueryProvider>{children}</QueryProvider>
    </MatchesProvider>
  );
};

export { AppProviders };
