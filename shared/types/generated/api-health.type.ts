/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** Successful database connectivity check response */
export interface HealthDatabaseListData {
  /**
   * Database type/name
   * @example "gel"
   */
  database: string;
  /**
   * Database connection string (credentials masked)
   * @example "gel://***@host.docker.internal:5656/main?tls_security=insecure"
   */
  dsn: string;
  /**
   * Result of the database test query
   * @example [{"1 + 1":2}]
   */
  test_result: unknown;
  /**
   * ISO timestamp when the database check was performed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/** Error response when database connectivity check fails */
export interface HealthDatabaseListError {
  /**
   * Additional error details (only present for connection errors)
   * @example "Connection timeout after 5000ms"
   */
  details?: string;
  /**
   * Error message describing the database connectivity issue
   * @example "Database connection failed"
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

/** Successful server health check response */
export interface HealthServerListData {
  /**
   * The name of the service being checked
   * @example "lazy_days_playground"
   */
  service: string;
  /**
   * ISO timestamp when the health check was performed
   * @format date-time
   * @pattern ^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$
   * @example "2024-01-01T00:00:00Z"
   */
  timestamp: string;
}

/** Error response when server health check fails */
export interface HealthServerListError {
  /**
   * Error message describing what went wrong
   * @example "Internal server error"
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
