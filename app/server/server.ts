import Fastify from "fastify";

import { BootstrapModule } from "./modules/bootstrap/bootstrap.module";

import { SERVER_SETTINGS } from "#shared/constants/server.constant";

const { PORT, SHUTDOWN_PATH, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const { bootstrapServer } = BootstrapModule;

const app = Fastify({ logger: true });

const { claimPort, shutdownRouteWithListeners } = bootstrapServer({
  app,
  port: PORT,
  shutdownPath: SHUTDOWN_PATH,
  shutdownToken: SHUTDOWN_TOKEN,
});

app.get("/", async () => ({ hello: "world" }));

await app.register(...shutdownRouteWithListeners);

await claimPort();
