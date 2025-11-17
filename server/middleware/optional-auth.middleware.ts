import type { FastifyReply, FastifyRequest } from "fastify";

import { AUTH_COOKIE_NAMES } from "../constants/auth-cookie.constant.ts";
import { AuthValidationHelper } from "../helpers/auth-validation.helper.ts";
import { CookieHelper } from "../helpers/cookie.helper.ts";

/**
 * Optional authentication middleware for Fastify routes
 *
 * Validates encrypted auth cookies if present and attaches user info to request
 * Does NOT reject the request if no valid token is found - just leaves request.user undefined
 *
 * Usage:
 * ```typescript
 * fastify.post("/endpoint", {
 *   preHandler: [optionalAuthMiddleware],
 * }, async (request, response) => {
 *   // request.user?.identity_id may or may not be available
 * });
 * ```
 */
const optionalAuthMiddleware = async (
  request: FastifyRequest,
  _response: FastifyReply
): Promise<void> => {
  const { ACCESS_TOKEN } = AUTH_COOKIE_NAMES;

  const { validateAuthToken } = AuthValidationHelper;
  const { getEncryptedCookie } = CookieHelper;

  try {
    const token = await getEncryptedCookie(request, ACCESS_TOKEN);

    if (!token) {
      // No token found - this is OK for optional auth
      return;
    }

    const { expiresAt, identityId, isValid } = await validateAuthToken(token);

    if (isValid) {
      request.user = {
        expiresAt: expiresAt,
        identity_id: identityId,
      };
    }
    // If invalid, just don't set request.user - don't reject the request
  } catch {
    // Silently fail - this endpoint should work with or without auth
  }
};

export { optionalAuthMiddleware };
