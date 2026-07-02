import { createClient } from "gel";

import type { AppInstance } from "@server/types/instance.type";

import type { AppEnv } from "@shared/types/app-env.type";

import type { DbClient } from "./types/db.type";

const createDbClient = (appEnv: AppEnv): DbClient => {
  const { dbBranch, dbClientTlsSecurity, dbHost, dbPassword, dbPort } = appEnv;

  return createClient({
    branch: dbBranch,
    host: dbHost,
    password: dbPassword,
    port: dbPort,
    tlsSecurity: dbClientTlsSecurity,
  });
};

const setupDb = (instance: AppInstance): void => {
  const client = createDbClient(instance.appEnv);

  instance.decorate("dbClient", client);

  instance.addHook("onClose", async () => {
    await client.close();
  });
};

const DbModule = Object.freeze({
  setupDb,
} as const);

export { DbModule };
