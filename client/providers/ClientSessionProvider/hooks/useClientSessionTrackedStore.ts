import { useTrackedStore } from "zustand-x";

import type { ClientSessionState } from "@client/providers/ClientSessionProvider/types/client-session.type";

import { useClientSessionContext } from "./useClientSessionContext";

const useClientSessionTrackedStore = (): Readonly<ClientSessionState> => {
  const clientSessionStore = useClientSessionContext();
  const trackedStore = useTrackedStore(clientSessionStore);

  return Object.freeze(trackedStore);
};

export { useClientSessionTrackedStore };
