import type { FastifyPluginAsync } from "fastify";

const rootRoute: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ hello: "world" }));
};

export { rootRoute };
