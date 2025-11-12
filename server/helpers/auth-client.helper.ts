import type { FastifyInstance } from "fastify";
import type { Client } from "gel";

import type { GelAuthInstance } from "@server/plugins/gel-auth-fastify";

import {
  HOST,
  IS_DEVELOPMENT,
  PORT,
} from "../../shared/constants/root-env.constant.ts";
import { createGelAuth } from "../plugins/gel-auth-fastify/index.ts";
import { GelDbHelper } from "./gel-db.helper.ts";

const { handleAuthError } = GelDbHelper;

const createAuth = (client: Client): GelAuthInstance => {
  return createGelAuth(client);
};

/**
 * Gets the Gel client from the Fastify instance.
 * The client is created once at startup and reused across all requests for connection pooling.
 *
 * @param fastify - The Fastify instance decorated with gelClient
 * @returns The shared Gel client instance
 */
const getClient = (fastify: FastifyInstance): Client => {
  return fastify.gelClient;
};

const getBaseUrl = (): string => {
  const protocol = IS_DEVELOPMENT ? "http" : "https";

  return `${protocol}://${HOST}:${PORT}`;
};

export const AuthClientHelper = {
  createAuth,
  getClient,
  getBaseUrl,
  handleAuthError,
};
