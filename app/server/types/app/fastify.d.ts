import type { DbClient } from "@server/modules/db";

import type { AppEnv } from "@shared/types/app-env.type";

declare module "fastify" {
  interface FastifyInstance {
    appEnv: AppEnv;
    dbClient: DbClient;
  }
}
