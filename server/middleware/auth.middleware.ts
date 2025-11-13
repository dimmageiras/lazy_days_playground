import type { FastifyReply, FastifyRequest } from "fastify";

import { IdUtilsHelper } from "../../shared/helpers/id-utils.helper.ts";
import { AUTH_COOKIE_NAMES } from "../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../constants/http-status.constant.ts";
import { AuthValidationHelper } from "../helpers/auth-validation.helper.ts";
import { CookieHelper } from "../helpers/cookie.helper.ts";
import { PinoLogHelper } from "../helpers/pino-log.helper.ts";
import { RoutesHelper } from "../helpers/routes.helper.ts";

/**
 * Authentication middleware for Fastify routes
 *
 * Validates encrypted auth cookies and attaches user info to request
 *
 * Usage:
 * ```typescript
 * fastify.get("/protected", {
 *   preHandler: [authMiddleware],
 * }, async (request, reply) => {
 *   // request.user.identity_id is available
 * });
 * ```
 */
const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { validateAuthToken } = AuthValidationHelper;
  const { getEncryptedCookie } = CookieHelper;
  const { fastIdGen } = IdUtilsHelper;
  const { log } = PinoLogHelper;
  const { getCurrentISOTimestamp } = RoutesHelper;

  const requestId = fastIdGen();
  const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;
  const { UNAUTHORIZED } = HTTP_STATUS;

  try {
    const token = await getEncryptedCookie(request, ACCESS_TOKEN);

    if (!token) {
      log.warn(
        {
          ip: request.ip,
          method: request.method,
          requestId,
          url: request.url,
        },
        "Authentication failed: no token provided"
      );

      return reply.status(UNAUTHORIZED).send({
        details: "No authentication token provided",
        error: "Authentication required",
        timestamp: getCurrentISOTimestamp(),
      });
    }

    const { expiresAt, identityId, isValid } = await validateAuthToken(token);

    if (!isValid) {
      reply.clearCookie(ACCESS_TOKEN);

      log.warn(
        {
          ip: request.ip,
          method: request.method,
          requestId,
          url: request.url,
        },
        "Authentication failed: invalid or expired token"
      );

      return reply.status(UNAUTHORIZED).send({
        details: "Please sign in again",
        error: "Invalid or expired authentication token",
        timestamp: getCurrentISOTimestamp(),
      });
    }

    request.user = {
      expiresAt: expiresAt,
      identity_id: identityId,
    };
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        ip: request.ip,
        method: request.method,
        requestId,
        stack: error instanceof Error ? error.stack : undefined,
        url: request.url,
      },
      "💥 Authentication middleware error"
    );

    return reply.status(UNAUTHORIZED).send({
      details: "Authentication verification failed",
      error: "Authentication required",
      timestamp: getCurrentISOTimestamp(),
    });
  }
};

export { authMiddleware };
