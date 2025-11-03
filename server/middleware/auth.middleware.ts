import type { FastifyReply, FastifyRequest } from "fastify";

import { DateHelper } from "../../shared/helpers/date.helper.ts";
import { AUTH_COOKIE_NAMES } from "../constants/auth-cookie.constant.ts";
import { HTTP_STATUS } from "../constants/http-status.constant.ts";
import { AuthValidationHelper } from "../helpers/auth-validation.helper.ts";
import { CookieHelper } from "../helpers/cookie.helper.ts";

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
  const { getCurrentISOTimestamp } = DateHelper;

  const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;
  const { UNAUTHORIZED } = HTTP_STATUS;

  const token = await getEncryptedCookie(request, ACCESS_TOKEN);

  if (!token) {
    return reply.status(UNAUTHORIZED).send({
      details: "No authentication token provided",
      error: "Authentication required",
      timestamp: getCurrentISOTimestamp(),
    });
  }

  const { expiresAt, identityId, isValid } = await validateAuthToken(token);

  if (!isValid) {
    reply.clearCookie(ACCESS_TOKEN);

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
};

export { authMiddleware };
