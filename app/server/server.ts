import Fastify from "fastify";

import { SERVER_SETTINGS } from "./constants/server.constant";
import { BootstrapModule } from "./modules/bootstrap/bootstrap.module";

const { HOST_LOOPBACK, PORT, SHUTDOWN_TOKEN } = SERVER_SETTINGS;

const { bootstrapServer } = BootstrapModule;

const app = Fastify({ logger: true });

const bootstrapConfigOptions = {
  hostLoopback: HOST_LOOPBACK,
  port: PORT,
  shutdownToken: SHUTDOWN_TOKEN,
};
const { claimPort, shutdownRouteWithListeners } = bootstrapServer({
  app,
  options: bootstrapConfigOptions,
});

app.get("/", async () => ({ hello: "world" }));

await app.register(...shutdownRouteWithListeners);

await claimPort();
