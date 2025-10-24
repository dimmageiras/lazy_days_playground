import { Auth } from "@gel/auth-core";
import type { FastifyRequest } from "fastify";

import { DateHelper } from "../../shared/helpers/date.helper.ts";

interface TokenValidationResult {
  expiresAt: Date | null;
  identityId: string | null;
  isValid: boolean;
}

/**
 * Validates a GEL auth token (JWT)
 *
 * Checks:
 * 1. Token expiration using GEL's built-in method
 * 2. Token format and structure
 * 3. Extracts identity_id from token payload
 *
 * @param token - JWT token to validate
 * @returns Validation result with identity_id and expiration
 *
 * @example
 * ```typescript
 * const result = await validateAuthToken(token);
 * if (!result.isValid) {
 *   return reply.status(401).send({ error: "Invalid token" });
 * }
 * // Use result.identityId
 * ```
 */
const validateAuthToken = async (
  token: string
): Promise<TokenValidationResult> => {
  const { getCurrentUTCDate } = DateHelper;

  try {
    const expiresAt = Auth.getTokenExpiration(token);

    if (!expiresAt) {
      return {
        expiresAt: null,
        identityId: null,
        isValid: false,
      };
    }

    const now = getCurrentUTCDate();

    if (expiresAt < now) {
      return {
        expiresAt,
        identityId: null,
        isValid: false,
      };
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return {
        expiresAt: null,
        identityId: null,
        isValid: false,
      };
    }

    const payload: FastifyRequest["user"] = JSON.parse(
      Buffer.from(Reflect.get(parts, 1), "base64").toString("utf8")
    );

    return {
      expiresAt,
      identityId: payload?.identity_id || null,
      isValid: true,
    };
  } catch {
    return {
      expiresAt: null,
      identityId: null,
      isValid: false,
    };
  }
};

/**
 * Quick validation check (returns boolean only)
 *
 * @param token - JWT token to validate
 * @returns true if token is valid and not expired
 */
const isValidAuthToken = async (token: string): Promise<boolean> => {
  const result = await validateAuthToken(token);

  return result.isValid;
};

export const AuthValidationHelper = {
  isValidAuthToken,
  validateAuthToken,
};
