/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Successful authentication check response */
export interface GetAuthData {
  /**
   * Unique identifier for the authenticated user
   * @example "12345678-1234-1234-1234-123456789abc"
   */
  identity_id: string | null;
  /**
   * ISO timestamp when the request was processed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/** Authentication error response */
export interface GetAuthError {
  /**
   * Additional error details
   * @example "No authentication token provided"
   */
  details: string;
  /**
   * Error message
   * @example "Authentication required"
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

/** Successful sign in response */
export interface SigninCreateData {
  /**
   * Unique identifier for the user identity
   * @example "12345678-1234-1234-1234-123456789abc"
   */
  identity_id: string | null;
  /**
   * ISO timestamp when the sign in was completed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Error response when sign in fails
 * Base error response when rate limit is exceeded
 */
export type SigninCreateError =
  | {
      /**
       * Additional error details (only present for caught errors)
       * @example "Invalid credentials provided"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Authentication failed"
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
       * Additional details about the signin rate limit error
       * @example "Rate limit exceeded for authentication attempts"
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

/** Request body for user sign in */
export interface SigninCreatePayload {
  /**
   * User's email address
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   * @example "user@example.com"
   */
  email: string;
  /**
   * User's password
   * @minLength 8
   * @example "SecurePassword123"
   */
  password: string;
}

/** Successful signup response */
export interface SignupCreateData {
  /**
   * Unique identifier for the user identity
   * @example "12345678-1234-1234-1234-123456789abc"
   */
  identity_id?: string | null;
  /**
   * Signup status - complete if no verification needed, verificationRequired if email verification is needed
   * @example "complete"
   */
  status: "complete" | "verificationRequired";
  /**
   * ISO timestamp when the signup was completed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
  /** PKCE verifier for email verification (only present when status is verificationRequired) */
  verifier?: string;
}

/**
 * Error response when signup fails
 * Base error response when rate limit is exceeded
 */
export type SignupCreateError =
  | {
      /**
       * Additional error details (only present for caught errors)
       * @example "Email already exists"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Registration failed"
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
       * Additional details about the signup rate limit error
       * @example "Rate limit exceeded for registration attempts"
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

/** Request body for user registration */
export interface SignupCreatePayload {
  /**
   * Password confirmation (must match password)
   * @minLength 1
   * @example "SecurePassword123"
   */
  confirmPassword: string;
  /**
   * User's email address
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   * @example "user@example.com"
   */
  email: string;
  /**
   * User's password (must be 8-50 chars with uppercase, lowercase, and number)
   * @minLength 8
   * @maxLength 50
   * @example "SecurePassword123"
   */
  password: string;
}

/** Successful email verification response */
export interface VerifyCreateData {
  /**
   * Unique identifier for the user identity
   * @example "12345678-1234-1234-1234-123456789abc"
   */
  identity_id: string | null;
  /**
   * ISO timestamp when the verification was completed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Error response when email verification fails
 * Base error response when rate limit is exceeded
 */
export type VerifyCreateError =
  | {
      /**
       * Additional error details (only present for caught errors)
       * @example "Invalid or expired verification token"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Verification failed"
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
       * Additional details about the verify rate limit error
       * @example "Rate limit exceeded for verification attempts"
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

/** Request body for email verification */
export interface VerifyCreatePayload {
  /**
   * Email verification token from the verification email
   * @example "abc123xyz789"
   */
  verificationToken: string;
  /**
   * PKCE verifier stored in cookie during signup
   * @example "def456uvw012"
   */
  verifier: string;
}
