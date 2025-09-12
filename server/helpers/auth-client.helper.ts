import type { Client } from "gel";
import { createClient as createGelClient } from "gel";

import {
  GEL_AUTH_BASE_URL,
  HOST,
  IS_DEVELOPMENT,
  PORT,
} from "../../shared/constants/root-env.constant.ts";
import type { GelAuthInstance } from "../plugins/gel-auth-fastify/gel-auth-fastify.plugin.ts";
import { createGelAuth } from "../plugins/gel-auth-fastify/index.ts";

const createAuth = (client: Client): GelAuthInstance => {
  return createGelAuth(client);
};

const createClient = (): Client => {
  return createGelClient({
    dsn: GEL_AUTH_BASE_URL,
  });
};

const getBaseUrl = (): string => {
  const protocol = IS_DEVELOPMENT ? "http" : "https";

  return `${protocol}://${HOST}:${PORT}`;
};

export const AuthClientHelper = {
  createAuth,
  createClient,
  getBaseUrl,
};
