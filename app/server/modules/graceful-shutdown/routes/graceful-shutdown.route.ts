import type { FastifyPluginAsync } from "fastify";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { StringHelper } from "@shared/helpers/string.helper";

import { GRACEFUL_SHUTDOWN_ROUTE } from "../constants/graceful-shutdown.constant";

const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const { isString } = StringHelper;

const gracefulShutdownRoutes: FastifyPluginAsync = async (instance) => {
  instance.post(`/${GRACEFUL_SHUTDOWN_ROUTE}`, (request, reply) => {
    const token = request.headers["x-shutdown-token"];

    if (!isString(token) || token !== instance.appEnv.shutdownToken) {
      request.log.warn("Rejected an unauthorized shutdown request");

      return reply.code(UNAUTHORIZED).send({ accepted: false });
    }

    reply.raw.once("finish", () => {
      instance.log.info("Shutdown requested via endpoint, closing…");

      instance.close().catch((error: unknown) => {
        instance.log.error(
          { err: error },
          "Failed to close after shutdown request",
        );
      });
    });

    return reply.code(ACCEPTED).send({ accepted: true });
  });
};

export { gracefulShutdownRoutes };
