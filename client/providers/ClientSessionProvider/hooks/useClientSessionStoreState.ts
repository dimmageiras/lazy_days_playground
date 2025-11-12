import { useStoreState } from "zustand-x";

import type { ClientSessionState } from "@client/providers/ClientSessionProvider/types/client-session.type";

import { useClientSessionContext } from "./useClientSessionContext";

const useClientSessionStoreState = <TSelector extends keyof ClientSessionState>(
  selector: TSelector
): readonly [
  ClientSessionState[TSelector],
  (value: ClientSessionState[TSelector]) => void
] => {
  const clientSessionStore = useClientSessionContext();
  const [state, setState] = useStoreState(clientSessionStore, selector);

  return Object.freeze([state, setState]);
};

export { useClientSessionStoreState };
