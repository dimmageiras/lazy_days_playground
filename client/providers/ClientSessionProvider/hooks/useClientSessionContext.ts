import { useContext } from "react";

import { ClientSessionContext } from "@client/providers/ClientSessionProvider/contexts/client-session.context";
import type { ClientSessionStore } from "@client/providers/ClientSessionProvider/types/client-session.type";

const useClientSessionContext = (): ClientSessionStore => {
  const context = useContext(ClientSessionContext);

  if (!context) {
    throw new Error(
      "useClientSessionContext must be used within a ClientSessionProvider"
    );
  }

  return context;
};

export { useClientSessionContext };
