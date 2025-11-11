import { createStore } from "zustand-x";

import type {
  ClientSessionState,
  ClientSessionStore,
} from "@client/providers/ClientSessionProvider/types/client-session.type";
import { HAS_DEV_TOOLS } from "@shared/constants/root-env.constant";

const createClientSessionStore = (
  initialState: Readonly<ClientSessionState>
): Readonly<ClientSessionStore> => {
  const store = createStore(initialState, {
    devtools: HAS_DEV_TOOLS,
    name: "client-session-store",
  });

  return Object.freeze(store);
};

export { createClientSessionStore };
