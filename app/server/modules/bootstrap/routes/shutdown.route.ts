import type { FastifyPluginAsync } from "fastify";
import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";

import { HTTP_STATUS } from "@shared/constants/network.constant";

import { HEADERS, INTERNAL_PATHS, SERVER_HOSTS } from "../constants";
import type { ShutdownRouteOptions } from "../types";

const { SHUTDOWN_TOKEN_HEADER } = HEADERS;
const { ACCEPTED, UNAUTHORIZED } = HTTP_STATUS;
const { SHUTDOWN } = INTERNAL_PATHS;
const { LOOPBACK_HOSTS } = SERVER_HOSTS;

const encodeLength = (length: number): Buffer => {
  const buffer = Buffer.allocUnsafe(4);

  buffer.writeUInt32BE(length, 0);

  return buffer;
};

const isTokenValid = (provided: unknown, expected: string): boolean => {
  if (typeof provided !== "string") {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  // Compare lengths via timingSafeEqual too so the length-mismatch branch and
  // the byte-mismatch branch perform the same operations — the length itself
  // is not leaked through the function's response timing.
  const lengthMatches = timingSafeEqual(
    encodeLength(providedBuffer.length),
    encodeLength(expectedBuffer.length),
  );

  const sized = Buffer.alloc(expectedBuffer.length);

  providedBuffer.copy(sized, 0, 0, expectedBuffer.length);

  const bytesMatch = timingSafeEqual(sized, expectedBuffer);

  return bytesMatch && lengthMatches;
};

const shutdownRoute: FastifyPluginAsync<ShutdownRouteOptions> = async (
  app,
  { closeListeners, token },
) => {
  app.post(SHUTDOWN, async (request, response) => {
    if (
      !LOOPBACK_HOSTS.has(request.ip) ||
      !isTokenValid(Reflect.get(request.headers, SHUTDOWN_TOKEN_HEADER), token)
    ) {
      return response.code(UNAUTHORIZED).send({ ok: false });
    }

    let triggered = false;
    const triggerClose = (): void => {
      if (triggered) {
        return;
      }

      triggered = true;
      closeListeners.close();
    };

    response.raw.once("finish", triggerClose);
    response.raw.once("close", triggerClose);

    return response.code(ACCEPTED).send({ ok: true });
  });
};

export { shutdownRoute };
