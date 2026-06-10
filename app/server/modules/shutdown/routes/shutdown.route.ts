import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HOSTS } from "@server/constants/hosts.constant";

import { HTTP_STATUS } from "@shared/constants/http.constant";
import { SetHelper } from "@shared/helpers/set.helper";
import { StringHelper } from "@shared/helpers/string.helper";

import { ENDPOINTS } from "../constants/endpoints.constant";
import { HEADERS } from "../constants/headers.constant";
import type { ShutdownRouteOptions } from "../types/shutdown.type";

const { SHUTDOWN } = ENDPOINTS;
const { SHUTDOWN_TOKEN } = HEADERS;
const { LOOPBACK_HOSTS } = HOSTS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;

const { hasSetValue } = SetHelper;
const { isString } = StringHelper;

const isAuthorizedToken = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const shutdownRoutes: FastifyPluginAsync<ShutdownRouteOptions> = async (
  instance,
  { handle },
) => {
  const shutdownRequestRoute = (
    request: FastifyRequest,
    reply: FastifyReply,
  ): FastifyReply => {
    const token = Reflect.get(request.headers, SHUTDOWN_TOKEN);

    if (
      !hasSetValue(LOOPBACK_HOSTS, request.ip) ||
      !isString(token) ||
      !isAuthorizedToken(token, instance.appEnv.shutdownToken)
    ) {
      request.log.warn(
        { ip: request.ip },
        "🚧 Rejected an unauthorized shutdown request",
      );

      return reply.code(UNAUTHORIZED).send({ accepted: false });
    }

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

export { shutdownRoutes };
