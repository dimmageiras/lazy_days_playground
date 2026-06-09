import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { StringHelper } from "@shared/helpers/string.helper";

import { GRACEFUL_SHUTDOWN_ENDPOINTS } from "../constants/graceful-shutdown.constant";
import type { GracefulShutdownRouteOptions } from "../types/graceful-shutdown.type";

const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;
const { SHUTDOWN } = GRACEFUL_SHUTDOWN_ENDPOINTS;

const { isString } = StringHelper;

const isAuthorizedToken = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  // Length-guard before timingSafeEqual (it throws on unequal lengths); the
  // byte compare stays constant-time so the token can't be recovered through
  // response timing.
  return (
    providedBuffer.length === expectedBuffer.length &&
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
      request.log.warn(
        { ip: request.ip },
        "⚠️ Rejected an unauthorized shutdown request",
      );

      return reply.code(UNAUTHORIZED).send({ accepted: false });
    }

    // Arm shutdown on the first terminal event, guarded against double-fire:
    // "finish" covers a clean flush, "close" covers a client abort that would
    // otherwise leave the 202 acked but the process never shutting down.
    let armed = false;

    const arm = (): void => {
      if (armed) {
        return;
      }

      armed = true;
      handle.close();
    };

    reply.raw.once("finish", arm);
    reply.raw.once("close", arm);

    return reply.code(ACCEPTED).send({ accepted: true });
  };

  instance.post(`/${SHUTDOWN}`, shutdownRequestRoute);
};

export { gracefulShutdownRoutes };
