import { INTERNAL_PATHS } from "@server/constants/paths.constant";
import type { FastifyPluginAsync } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HOSTS, HTTP_STATUS } from "@shared/constants/network.constant";

import { BOOTSTRAP_PROTOCOL } from "../constants/bootstrap.constant";
import type {
  ShutdownRouteConfig,
  ShutdownRouteOptions,
} from "../types/bootstrap.type";

const { SHUTDOWN_TOKEN_HEADER } = BOOTSTRAP_PROTOCOL;
const { LOOPBACK_HOSTS } = HOSTS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;
const { SHUTDOWN } = INTERNAL_PATHS;

/** Timing-safe equality check between a request header value and the expected secret; rejects non-string input. */
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

/** Builds the cooperative-shutdown Fastify plugin; legitimate callers trigger `closeListeners.close()` after the 202 has flushed. */
const createShutdownRoute =
  ({ token }: ShutdownRouteConfig): FastifyPluginAsync<ShutdownRouteOptions> =>
  async (app, { closeListeners }) => {
    app.post(SHUTDOWN, async (request, response) => {
      // Single rejection path: a loopback-peer can't tell IP-fail from token-fail
      // through the response. The IP check fires first and short-circuits;
      // legitimate callers (correct IP + correct token) flow through to 202.
      if (
        !LOOPBACK_HOSTS.has(request.ip) ||
        !isTokenValid(
          Reflect.get(request.headers, SHUTDOWN_TOKEN_HEADER),
          token,
        )
      ) {
        return response.code(UNAUTHORIZED).send({ ok: false });
      }

      // Per-reply hook on the underlying Node ServerResponse: fires only after
      // THIS response's bytes have flushed, so the caller sees the 202 before
      // app.close() takes the listener down. Fastify's onResponse hook is
      // app-wide and not the right granularity here.
      response.raw.on("finish", () => {
        closeListeners.close();
      });

      return response.code(ACCEPTED).send({ ok: true });
    });
  };

const ShutdownRoute = Object.freeze({
  createShutdownRoute,
} as const);

export { ShutdownRoute };
