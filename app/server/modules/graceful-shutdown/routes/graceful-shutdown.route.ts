import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { StringHelper } from "@shared/helpers/string.helper";

import { GRACEFUL_SHUTDOWN_ROUTE } from "../constants/graceful-shutdown.constant";
import type { GracefulShutdownRouteOptions } from "../types/graceful-shutdown.type";

const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const { isString } = StringHelper;

const gracefulShutdownRoutes: FastifyPluginAsync<
  GracefulShutdownRouteOptions
> = async (instance, { handle }) => {
  const shutdownRequestRoute = (
    request: FastifyRequest,
    reply: FastifyReply,
  ): FastifyReply => {
    const token = request.headers["x-shutdown-token"];

    if (!isString(token) || token !== instance.appEnv.shutdownToken) {
      request.log.warn("Rejected an unauthorized shutdown request");

      return reply.code(UNAUTHORIZED).send({ accepted: false });
    }

    reply.raw.once("finish", () => {
      handle.close();
    });

    return reply.code(ACCEPTED).send({ accepted: true });
  };

  instance.post(`/${GRACEFUL_SHUTDOWN_ROUTE}`, shutdownRequestRoute);
};

export { gracefulShutdownRoutes };
