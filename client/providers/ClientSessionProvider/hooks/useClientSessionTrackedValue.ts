import { useTracked } from "zustand-x";

import type { ClientSessionState } from "@client/providers/ClientSessionProvider/types/client-session.type";

import { useClientSessionContext } from "./useClientSessionContext";

const useClientSessionTrackedValue = <
  TSelector extends keyof ClientSessionState
>(
  selector: TSelector
): Readonly<ClientSessionState[TSelector]> => {
  const clientSessionStore = useClientSessionContext();
  const trackedStore = useTracked(clientSessionStore, selector);

  return Object.freeze(trackedStore);
};

export { useClientSessionTrackedValue };
