import type { AsyncLocalStorage } from "node:async_hooks";
import type { Cookie } from "react-router";

import { CookieHelper } from "@client/helpers/cookie.helper";
import { IdUtilsHelper } from "@shared/helpers/id-utils.helper";

interface ClientIdRouteContextValue {
  clientId?: string;
  request: Request;
}

let clientIdRouteContextStorage: AsyncLocalStorage<ClientIdRouteContextValue> | null =
  null;

if (import.meta.env.SSR) {
  const { AsyncLocalStorage } = await import("node:async_hooks");

  clientIdRouteContextStorage =
    new AsyncLocalStorage<ClientIdRouteContextValue>();
}

/**
 * Gets the current request from the async local storage.
 * Only available during SSR within the context of a request.
 *
 * @returns The current Request object or undefined if not in request context
 *
 * @example
 * ```typescript
 * const request = getRequest();
 * if (request) {
 *   const userAgent = request.headers.get("user-agent");
 * }
 * ```
 */
const getRequest = (): Request | undefined => {
  return clientIdRouteContextStorage?.getStore()?.request;
};

/**
 * Checks if the current request has an access token cookie.
 * Used to determine if authentication-related operations should be performed.
 *
 * @returns True if an access-token cookie exists, false otherwise
 *
 * @example
 * ```typescript
 * if (hasAccessToken()) {
 *   // Proceed with authenticated request handling
 * }
 * ```
 */
const hasAccessToken = (): boolean => {
  if (!import.meta.env.SSR) {
    return false;
  }

  const store = clientIdRouteContextStorage?.getStore();

  if (!store?.request) {
    return false;
  }

  const cookieHeader = store.request.headers.get("cookie");

  if (!cookieHeader) {
    return false;
  }

  return cookieHeader
    .split(";")
    .some((cookie) => cookie.trim().startsWith("access-token="));
};

/**
 * Retrieves an existing client ID from the cookie or async local storage cache.
 * Does not create a new ID if one doesn't exist.
 *
 * @param clientIdCookie - The Cookie instance configured for client ID
 * @returns Promise resolving to the client ID string or null if not found
 *
 * @example
 * ```typescript
 * const clientIdCookie = createStandardCookie("client-id");
 * const existingId = await getExistingClientId(clientIdCookie);
 * if (existingId) {
 *   console.log("Found existing client ID:", existingId);
 * }
 * ```
 */
const getExistingClientId = async (
  clientIdCookie: Cookie,
): Promise<string | null> => {
  const store = clientIdRouteContextStorage?.getStore();

  if (store?.clientId) {
    return store.clientId;
  }

  if (!import.meta.env.SSR || !store?.request) {
    return null;
  }

  const { parseCookie } = CookieHelper;

  const cookieHeader = store.request.headers.get("cookie");
  const clientId = await parseCookie(clientIdCookie, cookieHeader);

  if (clientId) {
    store.clientId = clientId;
  }

  return clientId;
};

/**
 * Gets an existing client ID or creates a new one if it doesn't exist.
 * The generated ID is cached in async local storage and sent as a cookie.
 * Used for coordinating SSR and client-side React Query cache hydration.
 *
 * @param clientIdCookie - The Cookie instance configured for client ID
 * @returns Promise resolving to a client ID string (existing or newly generated)
 *
 * @example
 * ```typescript
 * const clientIdCookie = createStandardCookie("client-id");
 * const clientId = await getOrCreateClientId(clientIdCookie);
 * // Use clientId as part of query keys for cache coordination
 * const queryKey = ["auth", "verify", clientId];
 * ```
 */
const getOrCreateClientId = async (clientIdCookie: Cookie): Promise<string> => {
  const { secureIdGen } = IdUtilsHelper;

  const existingClientId = await getExistingClientId(clientIdCookie);

  if (existingClientId) {
    return existingClientId;
  }

  const newClientId = secureIdGen();
  const store = clientIdRouteContextStorage?.getStore();

  if (store) {
    store.clientId = newClientId;
  }

  return newClientId;
};

/**
 * Gets the client ID for authenticated users only.
 * Returns null if no access token is present.
 *
 * @param clientIdCookie - The Cookie instance configured for client ID
 * @returns Promise resolving to client ID string if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const clientIdCookie = createStandardCookie("client-id");
 * const clientId = await getClientId(clientIdCookie);
 * if (clientId) {
 *   // User is authenticated, proceed with auth queries
 * }
 * ```
 */
const getClientId = async (clientIdCookie: Cookie): Promise<string | null> => {
  if (!hasAccessToken()) {
    return null;
  }

  return getExistingClientId(clientIdCookie);
};

/**
 * Runs a callback within the async local storage context of a request.
 * This enables context-aware operations like cookie parsing during SSR.
 *
 * @param request - The Request object to store in context
 * @param callback - The callback function to execute within the request context
 * @returns The result of the callback function
 *
 * @example
 * ```typescript
 * return run(request, async () => {
 *   const clientId = await getOrCreateClientId(clientIdCookie);
 *   return fetchAuthData(clientId);
 * });
 * ```
 */
const run = <TResponse>(
  request: Request,
  callback: () => TResponse,
): TResponse => {
  if (clientIdRouteContextStorage) {
    return clientIdRouteContextStorage.run({ request }, callback);
  }

  return callback();
};

export const ClientIdRouteContext = {
  getClientId,
  getExistingClientId,
  getOrCreateClientId,
  getRequest,
  hasAccessToken,
  run,
};
