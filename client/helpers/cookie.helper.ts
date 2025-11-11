import type { Cookie } from "react-router";
import { createCookie } from "react-router";

import { IS_DEVELOPMENT } from "@shared/constants/root-env.constant";
import { DateHelper } from "@shared/helpers/date.helper";

/**
 * Creates a cookie instance with standard configuration.
 * Note: `expires` and `maxAge` are set during serialization, not here.
 *
 * @param name - The name of the cookie
 * @returns Configured Cookie instance
 *
 * @example
 * ```typescript
 * // Create a cookie configuration (expiration set when writing)
 * const myCookie = createStandardCookie("session-token");
 * ```
 */
const createStandardCookie = (name: string): Cookie => {
  return createCookie(name, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: !IS_DEVELOPMENT,
  });
};

/**
 * Parses a cookie from a cookie header string.
 *
 * @param cookieInstance - The Cookie instance to use for parsing
 * @param cookieHeader - The cookie header string to parse
 * @returns Promise resolving to the parsed cookie value or null
 *
 * @example
 * ```typescript
 * const sessionCookie = createStandardCookie("session-token");
 * const cookieHeader = request.headers.get("cookie");
 * const sessionToken = await parseCookie(sessionCookie, cookieHeader);
 * ```
 */
const parseCookie = async <TReturnValue = string>(
  cookieInstance: Cookie,
  cookieHeader: string | null
): Promise<TReturnValue | null> => {
  if (!cookieHeader) {
    return null;
  }

  try {
    const value: TReturnValue = await cookieInstance.parse(cookieHeader);

    return value ?? null;
  } catch {
    return null;
  }
};

/**
 * Serializes a cookie value into a Set-Cookie header string.
 * Sets both `expires` and `maxAge` for maximum browser compatibility.
 *
 * @param cookieInstance - The Cookie instance to use for serialization
 * @param value - The value to serialize
 * @param maxAge - Maximum age in seconds (e.g., 300 for 5 minutes)
 * @returns Promise resolving to the serialized cookie string
 *
 * @example
 * ```typescript
 * const sessionCookie = createStandardCookie("session-token");
 * const serialized = await serializeCookie(sessionCookie, "abc123", 300);
 * response.headers.append("Set-Cookie", serialized);
 * ```
 */
const serializeCookie = async <TValue = string>(
  cookieInstance: Cookie,
  value: TValue,
  maxAge: number
): Promise<string> => {
  const { getCurrentUTCDate } = DateHelper;

  const expires = new Date(getCurrentUTCDate().getTime() + maxAge * 1000);

  return await cookieInstance.serialize(value, {
    expires,
    maxAge,
  });
};

/**
 * Checks if a cookie exists in the cookie header.
 *
 * @param cookieInstance - The Cookie instance to check
 * @param cookieHeader - The cookie header string to check
 * @returns Promise resolving to true if cookie exists, false otherwise
 *
 * @example
 * ```typescript
 * const sessionCookie = createStandardCookie("session-token");
 * const cookieHeader = request.headers.get("cookie");
 * const exists = await hasCookie(sessionCookie, cookieHeader);
 * ```
 */
const hasCookie = async (
  cookieInstance: Cookie,
  cookieHeader: string | null
): Promise<boolean> => {
  const value = await parseCookie(cookieInstance, cookieHeader);

  return value !== null;
};

/**
 * Sets a cookie on a Response object.
 *
 * @param response - The Response object to modify
 * @param cookieInstance - The Cookie instance to use
 * @param value - The value to set
 * @param maxAge - Maximum age in seconds (e.g., 300 for 5 minutes)
 * @returns Promise that resolves when cookie is set
 *
 * @example
 * ```typescript
 * const sessionCookie = createStandardCookie("session-token");
 * await setCookie(response, sessionCookie, "abc123", 300);
 * ```
 */
const setCookie = async <TValue = string>(
  response: Response,
  cookieInstance: Cookie,
  value: TValue,
  maxAge: number
): Promise<void> => {
  const serialized = await serializeCookie(cookieInstance, value, maxAge);

  response.headers.append("Set-Cookie", serialized);
};

export const CookieHelper = {
  createStandardCookie,
  hasCookie,
  parseCookie,
  setCookie,
};
