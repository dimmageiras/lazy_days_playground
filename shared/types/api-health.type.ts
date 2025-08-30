/**
 * Shared types for API Health endpoints
 * Used by both frontend and backend for type safety
 */

import type { API_HEALTH_STATUSES } from "@shared/constants/api-health.constant";

/** Common health status values */
type ApiHealthStatus =
  (typeof API_HEALTH_STATUSES)[keyof typeof API_HEALTH_STATUSES];

/** Base properties shared by all health responses */
interface ApiHealthBaseResponse {
  status: ApiHealthStatus;
  timestamp: string;
}

/** Server health check success response */
interface ApiHealthServerSuccessResponse extends ApiHealthBaseResponse {
  service: string;
  status: "healthy";
}

/** Server health check error response */
interface ApiHealthServerErrorResponse extends ApiHealthBaseResponse {
  error: string;
  status: "unhealthy";
}

/** Database health check success response */
interface ApiHealthDbSuccessResponse extends ApiHealthBaseResponse {
  database: string;
  dsn: string;
  status: "healthy";
  test_result: unknown; // Gel query result can vary
}

/** Database health check error response - DSN not configured */
interface ApiHealthDbDsnErrorResponse extends ApiHealthBaseResponse {
  error: "Database DSN not configured";
  status: "unhealthy";
}

/** Database health check error response - Connection failed */
interface ApiHealthDbConnectionErrorResponse extends ApiHealthBaseResponse {
  details: string;
  error: "Database connection failed";
  status: "unhealthy";
}

export type {
  ApiHealthDbConnectionErrorResponse,
  ApiHealthDbDsnErrorResponse,
  ApiHealthDbSuccessResponse,
  ApiHealthServerErrorResponse,
  ApiHealthServerSuccessResponse,
};
