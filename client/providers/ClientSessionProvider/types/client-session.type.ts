import type { AnyFunction, TStateApi } from "zustand-x";

interface ClientSessionState {
  clientId: string;
  isAuthenticated: boolean;
}

type ClientSessionStore = TStateApi<
  ClientSessionState,
  [["zustand/devtools", never]],
  Record<string, AnyFunction>,
  Record<string, AnyFunction>
>;

export type { ClientSessionState, ClientSessionStore };
