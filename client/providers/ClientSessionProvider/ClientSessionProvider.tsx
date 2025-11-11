import type { JSX, PropsWithChildren } from "react";
import { useMemo } from "react";

import { ClientSessionContext } from "./contexts/client-session.context";
import { createClientSessionStore } from "./stores/client-session.store";

interface ClientSessionProviderProps extends PropsWithChildren {
  clientId: string;
  isAuthenticated: boolean;
}

const ClientSessionProvider = ({
  children,
  clientId,
  isAuthenticated,
}: ClientSessionProviderProps): JSX.Element => {
  const clientSessionStore = useMemo(
    () =>
      createClientSessionStore({
        clientId,
        isAuthenticated,
      }),
    [clientId, isAuthenticated]
  );

  return (
    <ClientSessionContext.Provider value={clientSessionStore}>
      {children}
    </ClientSessionContext.Provider>
  );
};

export { ClientSessionProvider };
