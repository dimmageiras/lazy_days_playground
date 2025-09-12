import { Auth } from "@gel/auth-core";

import { EmailPasswordHandlersHelper } from "./helpers/email-password-handlers.helper.ts";
import type { GelAuthFactory, GelAuthInstance } from "./types/auth-core.type";

const createGelAuth: GelAuthFactory = (client) => {
  const core = Auth.create(client);

  const { getEmailPasswordHandlers } = EmailPasswordHandlersHelper;

  const emailPasswordHandlers = getEmailPasswordHandlers(core);

  const fastifyAuth = {
    emailPasswordHandlers,
  } satisfies GelAuthInstance;

  return fastifyAuth;
};

export { createGelAuth };
