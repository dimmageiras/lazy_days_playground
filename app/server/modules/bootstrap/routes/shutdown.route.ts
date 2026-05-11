import type { FastifyPluginAsync } from "fastify";

import type {
  ShutdownRouteConfig,
  ShutdownRouteOptions,
} from "../types/bootstrap.type.ts";

const createShutdownRoute =
  ({
    path,
    token,
  }: ShutdownRouteConfig): FastifyPluginAsync<ShutdownRouteOptions> =>
  async (app, { closeListeners }) => {
    app.post(path, async (request, reply) => {
      if (request.ip !== "127.0.0.1" && request.ip !== "::1") {
        return reply.code(403).send({ ok: false });
      }

      if (request.headers["x-shutdown-token"] !== token) {
        return reply.code(401).send({ ok: false });
      }

      reply.raw.on("finish", () => {
        void closeListeners.close();
      });

      return reply.code(202).send({ ok: true });
    });
  };

export const ShutdownRoute = { createShutdownRoute };
