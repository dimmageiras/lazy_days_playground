/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Successful email availability check response */
export interface CheckEmailCreateData {
  /**
   * Additional details about the email check result
   * @example "Email is available for registration"
   */
  details?: string;
  /**
   * The email address that was checked
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   * @example "user@example.com"
   */
  email: string;
  /**
   * Whether the email already exists in the system
   * @example false
   */
  exists: boolean;
  /**
   * ISO timestamp when the email check was performed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Error response when email check fails
 * Base error response when rate limit is exceeded
 */
export type CheckEmailCreateError =
  | {
      /**
       * Additional error details (only present for caught errors)
       * @example "Database connection timeout"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Failed to check email availability"
       */
      error: string;
      /**
       * ISO timestamp when the error occurred
       * @format date-time
       * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
       * @example "2024-01-01T00:00:00Z"
       */
      timestamp: string;
    }
  | {
      /**
       * Additional details about the check-email rate limit error
       * @example "Rate limit exceeded for email existence checks"
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
       * @exclusiveMin 0
       * @max 9007199254740991
       * @example 30
       */
      retryAfter: number;
      /**
       * HTTP status code
       * @example 429
       */
      statusCode: 429;
    };

/** Request body for checking email availability */
export interface CheckEmailCreatePayload {
  /**
   * Email address to check for availability
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   * @example "user@example.com"
   */
  email: string;
}
