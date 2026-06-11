import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { DateHelper } from "@shared/helpers/date.helper";
import { StringHelper } from "@shared/helpers/string.helper";

import { ENDPOINTS } from "../constants/endpoints.constant";
import type { GracefulShutdownRouteOptions } from "../types/graceful-shutdown.type";

const { SHUTDOWN } = ENDPOINTS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const { getCurrentTimestamp } = DateHelper;
const { isString } = StringHelper;

const isAuthorizedToken = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    !Buffer.compare(providedBuffer, expectedBuffer) &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const gracefulShutdownRoutes: FastifyPluginAsync<
  GracefulShutdownRouteOptions
> = async (instance, { handle }) => {
  const shutdownRequestRoute = (
    request: FastifyRequest,
    reply: FastifyReply,
  ): FastifyReply => {
    const token = request.headers["x-shutdown-token"];

    if (
      !isString(token) ||
      !isAuthorizedToken(token, instance.appEnv.shutdownToken)
    ) {
      request.log.warn("Rejected an unauthorized shutdown request");

      return reply
        .code(UNAUTHORIZED)
        .send({ accepted: false, timestamp: getCurrentTimestamp() });
    }

    reply.raw.once("finish", () => {
      handle.close();
    });

    return reply
      .code(ACCEPTED)
      .send({ accepted: true, timestamp: getCurrentTimestamp() });
  };

  instance.post(`/${SHUTDOWN}`, shutdownRequestRoute);
};

export { gracefulShutdownRoutes };
