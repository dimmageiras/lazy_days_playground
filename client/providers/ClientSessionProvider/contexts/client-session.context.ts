import { createContext } from "react";

import type { ClientSessionStore } from "@client/providers/ClientSessionProvider/types/client-session.type";

const ClientSessionContext = createContext<ClientSessionStore | null>(null);

export { ClientSessionContext };
