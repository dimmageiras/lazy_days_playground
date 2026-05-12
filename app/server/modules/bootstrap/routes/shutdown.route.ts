import type { FastifyPluginAsync } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HOSTS, HTTP_STATUS } from "@shared/constants/network.constant";

import { INTERNAL_PATHS } from "../../../constants/paths.constant";
import type {
  ShutdownRouteConfig,
  ShutdownRouteOptions,
} from "../types/bootstrap.type";

const { APP_HOST, LOOPBACK_IPV6 } = HOSTS;
const { ACCEPTED, FORBIDDEN, UNAUTHORIZED } = HTTP_STATUS;
const { SHUTDOWN } = INTERNAL_PATHS;

const isTokenValid = (provided: unknown, expected: string): boolean => {
  if (typeof provided !== "string") {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

const createShutdownRoute =
  ({ token }: ShutdownRouteConfig): FastifyPluginAsync<ShutdownRouteOptions> =>
  async (app, { closeListeners }) => {
    app.post(SHUTDOWN, async (request, response) => {
      if (request.ip !== APP_HOST && request.ip !== LOOPBACK_IPV6) {
        return response.code(FORBIDDEN).send({ ok: false });
      }

      if (!isTokenValid(request.headers["x-shutdown-token"], token)) {
        return response.code(UNAUTHORIZED).send({ ok: false });
      }

      response.raw.on("finish", () => {
        void closeListeners.close();
      });

      return response.code(ACCEPTED).send({ ok: true });
    });
  };

export const ShutdownRoute = { createShutdownRoute };
