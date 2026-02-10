import type { FastifyRequest } from "fastify";

import { EncryptionHelper } from "./encryption.helper.ts";

/**
 * Safely retrieves, validates, and decrypts an encrypted+signed cookie
 *
 * @param request - Fastify request object
 * @param cookieName - Name of the cookie to retrieve
 * @returns Decrypted cookie value if valid, null if invalid or missing
 *
 * @example
 * ```typescript
 * const token = await getEncryptedCookie(request, "access-token");
 * if (!token) {
 *   return response.status(401).send({ error: "Invalid authentication" });
 * }
 * ```
 */
const getEncryptedCookie = async (
  request: FastifyRequest,
  cookieName: string,
): Promise<string | null> => {
  const { decryptData } = EncryptionHelper;
  const cookieValue = Reflect.get(request.cookies, cookieName);

  if (!cookieValue || typeof cookieValue !== "string") {
    return null;
  }

  const unsigned = request.unsignCookie(cookieValue);

  if (!unsigned.valid || !unsigned.value) {
    return null;
  }

  try {
    const decrypted = await decryptData(unsigned.value);

    return decrypted;
  } catch {
    return null;
  }
};

/**
 * Checks if an encrypted+signed cookie exists and is valid
 *
 * @param request - Fastify request object
 * @param cookieName - Name of the cookie to check
 * @returns true if cookie exists, signature is valid, and decryption succeeds
 *
 * @example
 * ```typescript
 * const isValid = await hasEncryptedSignedCookie(request, "access-token");
 * if (!isValid) {
 *   return response.status(401).send({ error: "Not authenticated" });
 * }
 * ```
 */
const hasEncryptedCookie = async (
  request: FastifyRequest,
  cookieName: string,
): Promise<boolean> => {
  const value = await getEncryptedCookie(request, cookieName);

  return value !== null;
};

export const CookieHelper = {
  getEncryptedCookie,
  hasEncryptedCookie,
};
