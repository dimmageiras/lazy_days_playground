import type { FastifyPluginAsync } from "fastify";

import { INTERNAL_PATHS } from "../../../constants/paths.constant";
import type {
  ShutdownRouteConfig,
  ShutdownRouteOptions,
} from "../types/bootstrap.type";

import { HOSTS, HTTP_STATUS } from "#shared/constants/network.constant.js";

const { ACCEPTED, FORBIDDEN, UNAUTHORIZED } = HTTP_STATUS;
const { LOOPBACK_IPV6 } = HOSTS;
const { SHUTDOWN } = INTERNAL_PATHS;

const createShutdownRoute =
  ({
    hostLoopback,
    token,
  }: ShutdownRouteConfig): FastifyPluginAsync<ShutdownRouteOptions> =>
  async (app, { closeListeners }) => {
    app.post(SHUTDOWN, async (request, response) => {
      if (request.ip !== hostLoopback && request.ip !== LOOPBACK_IPV6) {
        return response.code(FORBIDDEN).send({ ok: false });
      }

      if (request.headers["x-shutdown-token"] !== token) {
        return response.code(UNAUTHORIZED).send({ ok: false });
      }

      response.raw.on("finish", () => {
        void closeListeners.close();
      });

      return response.code(ACCEPTED).send({ ok: true });
    });
  };

export const ShutdownRoute = { createShutdownRoute };
