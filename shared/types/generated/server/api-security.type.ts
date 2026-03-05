/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Successful CSRF token generation response */
export interface SecurityCsrfTokenListData {
  /**
   * The generated CSRF token to include in mutating request headers
   * @example "a1b2c3d4e5f6"
   */
  csrfToken: string;
  /**
   * ISO timestamp when the token was generated
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/** Base error response when rate limit is exceeded */
export interface SecurityCsrfTokenListError {
  /**
   * Additional details about the CSRF token rate limit error
   * @example "Rate limit exceeded for CSRF token generation"
   */
  details?: string;
  /**
   * Error type
   * @example "Too Many Requests"
   */
  error: string;
  /**
   * Human-readable message
   * @example "Rate limit exceeded. Try again in 30 seconds."
   */
  message: string;
  /**
   * Seconds until retry
   * @exclusiveMin true
   * @max 9007199254740991
   * @example 30
   */
  retryAfter: number;
  /**
   * HTTP status code
   * @example 429
   */
  statusCode: 429;
}
