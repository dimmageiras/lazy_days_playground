import Fastify from "fastify";

import { SERVER_SETTINGS } from "#shared/constants/server.constant.ts";

import { NoNameModule } from "./noname/noname.module.ts";

const { PORT, SHUTDOWN_PATH, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const { createServerLifecycle } = NoNameModule;

const app = Fastify({ logger: true });

const { shutdownRouteWithListeners, claimPort } = createServerLifecycle({
  app,
  port: PORT,
  shutdownPath: SHUTDOWN_PATH,
  shutdownToken: SHUTDOWN_TOKEN,
});

app.get("/", async () => ({ hello: "world" }));

await app.register(...shutdownRouteWithListeners);

await claimPort();
