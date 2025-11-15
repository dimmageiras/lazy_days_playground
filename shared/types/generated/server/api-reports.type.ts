/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Successful CSP reports clear response */
export interface ReportsCspClearDeleteData {
  /**
   * Number of CSP reports that were deleted
   * @example 42
   */
  count: number;
  /**
   * Indicates successful deletion of all CSP reports
   * @example true
   */
  success: boolean;
  /**
   * ISO timestamp when the reports were cleared
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Base error response when rate limit is exceeded
 * Error response when CSP reports clear fails
 */
export type ReportsCspClearDeleteError =
  | {
      /**
       * Additional details about why the CSP reports clear rate limit was triggered
       * @example "Too many clear requests submitted in a short time period"
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
    }
  | {
      /**
       * Additional error details
       * @example "Database connection error"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Failed to clear CSP reports"
       */
      error: string;
      /**
       * ISO timestamp when the error occurred
       * @format date-time
       * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
       * @example "2024-01-01T00:00:00Z"
       */
      timestamp: string;
    };

/** Successful CSP report deletion response */
export interface ReportsCspDeleteDeleteData {
  /**
   * Indicates successful deletion of the CSP report
   * @example true
   */
  success: boolean;
  /**
   * ISO timestamp when the report was deleted
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Error response when CSP report deletion fails
 * Base error response when rate limit is exceeded
 */
export type ReportsCspDeleteDeleteError =
  | {
      /**
       * Additional error details
       * @example "Report not found"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Failed to delete CSP report"
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
       * Additional details about why the CSP report deletion rate limit was triggered
       * @example "Too many deletion requests submitted in a short time period"
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

export interface ReportsCspDeleteDeleteParams {
  /**
   * Unique identifier of the CSP report to delete
   * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  id: string;
}

/** Successful CSP report list retrieval response */
export interface ReportsCspListListData {
  /**
   * Total number of reports returned
   * @example 10
   */
  count: number;
  /** Array of CSP violation reports */
  data: {
    /**
     * The URI of the resource that was blocked from loading
     * @example "https://evil.example.com/malicious.js"
     */
    blocked_uri: string;
    /**
     * The column number in the source file where the violation occurred
     * @example 15
     */
    column_number?: number | null;
    /**
     * Timestamp when the report was created
     * @format date-time
     * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
     * @example "2024-01-01T00:00:00Z"
     */
    created_at: string;
    /**
     * Whether the user agent enforced or only reported the policy
     * @example "enforce"
     */
    disposition?: string | null;
    /**
     * The URI of the document where the violation occurred
     * @example "https://example.com/page"
     */
    document_uri: string;
    /**
     * The directive whose enforcement caused the violation
     * @example "script-src"
     */
    effective_directive: string;
    /**
     * Unique identifier for the CSP report
     * @example "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
     */
    id: string;
    /**
     * IP address of the client that triggered the violation
     * @example "192.168.1.1"
     */
    ip_address?: string | null;
    /**
     * The line number in the source file where the violation occurred
     * @example 42
     */
    line_number?: number | null;
    /**
     * The original policy as specified by the Content-Security-Policy header
     * @example "default-src 'self'; script-src 'self'"
     */
    original_policy: string;
    /**
     * The referrer of the document where the violation occurred
     * @example "https://example.com/"
     */
    referrer: string;
    /**
     * Sample of the script that caused the violation
     * @example "eval('malicious code')"
     */
    script_sample?: string | null;
    /**
     * The URL of the resource where the violation occurred
     * @example "https://example.com/script.js"
     */
    source_file?: string | null;
    /**
     * The HTTP status code of the resource on which the violation occurred
     * @example 200
     */
    status_code: number;
    /**
     * User agent string of the client
     * @example "Mozilla/5.0..."
     */
    user_agent?: string | null;
    /**
     * The directive whose enforcement caused the violation (deprecated, use effective-directive)
     * @example "script-src 'self'"
     */
    violated_directive?: string | null;
  }[];
  /**
   * Indicates successful retrieval of CSP reports
   * @example true
   */
  success: boolean;
  /**
   * ISO timestamp when the reports were retrieved
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Base error response when rate limit is exceeded
 * Error response when CSP report list retrieval fails
 */
export type ReportsCspListListError =
  | {
      /**
       * Additional details about why the CSP report list rate limit was triggered
       * @example "Too many requests to retrieve CSP reports in a short time period"
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
    }
  | {
      /**
       * Additional error details
       * @example "Database connection error"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Failed to retrieve CSP reports"
       */
      error: string;
      /**
       * ISO timestamp when the error occurred
       * @format date-time
       * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
       * @example "2024-01-01T00:00:00Z"
       */
      timestamp: string;
    };

/** Successful CSP report submission response */
export interface ReportsCspReportCreateData {
  /**
   * Indicates successful receipt of the CSP report
   * @example true
   */
  success: boolean;
  /**
   * ISO timestamp when the report was received
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/**
 * Error response when CSP report processing fails
 * Base error response when rate limit is exceeded
 */
export type ReportsCspReportCreateError =
  | {
      /**
       * Additional error details
       * @example "Invalid report format"
       */
      details?: string;
      /**
       * Error message describing what went wrong
       * @example "Failed to process CSP report"
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
       * Additional details about why the CSP report rate limit was triggered
       * @example "Too many CSP violation reports submitted in a short time period"
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

/** CSP violation report request body */
export interface ReportsCspReportCreatePayload {
  /** Content Security Policy violation report */
  "csp-report": {
    /**
     * The URI of the resource that was blocked from loading
     * @example "https://evil.example.com/malicious.js"
     */
    "blocked-uri": string;
    /**
     * The column number in the source file where the violation occurred
     * @example 15
     */
    "column-number"?: number | null;
    /**
     * The URI of the document where the violation occurred
     * @example "https://example.com/page"
     */
    "document-uri": string;
    /**
     * The directive whose enforcement caused the violation
     * @example "script-src"
     */
    "effective-directive": string;
    /**
     * The line number in the source file where the violation occurred
     * @example 42
     */
    "line-number"?: number | null;
    /**
     * The original policy as specified by the Content-Security-Policy header
     * @example "default-src 'self'; script-src 'self'"
     */
    "original-policy": string;
    /**
     * The URL of the resource where the violation occurred
     * @example "https://example.com/script.js"
     */
    "source-file"?: string | null;
    /**
     * The HTTP status code of the resource on which the violation occurred
     * @example 200
     */
    "status-code": number;
    /**
     * The directive whose enforcement caused the violation (deprecated, use effective-directive)
     * @example "script-src 'self'"
     */
    "violated-directive"?: string | null;
    /**
     * Whether the user agent enforced or only reported the policy
     * @example "enforce"
     */
    disposition?: string | null;
    /**
     * The referrer of the document where the violation occurred
     * @example "https://example.com/"
     */
    referrer: string;
  };
}
