import type { Client } from "gel";

import type { EmailPasswordHandlers } from "./handlers.type";

type GelAuthFactory = (client: Client) => {
  emailPasswordHandlers: EmailPasswordHandlers;
};

type GelAuthInstance = ReturnType<GelAuthFactory>;

export type { GelAuthFactory, GelAuthInstance };
