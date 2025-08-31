import axios from "axios";

import { API_HEALTH_BASE_URL } from "@shared/constants/base-urls.const";
import type {
  ApiHealthDbConnectionErrorResponse,
  ApiHealthDbDsnErrorResponse,
  ApiHealthDbSuccessResponse,
  ApiHealthServerErrorResponse,
  ApiHealthServerSuccessResponse,
} from "@shared/types/api-health.type";

/**
 * API Health Service
 * Provides functions to fetch health status from server and database endpoints
 * Uses base URLs from shared constants for consistency
 */

/**
 * Fetches database health status from GET /api/health/db
 * @returns Promise resolving to database health response
 * @throws AxiosError if request fails
 */
const getDatabaseHealth = async (): Promise<
  | ApiHealthDbSuccessResponse
  | ApiHealthDbDsnErrorResponse
  | ApiHealthDbConnectionErrorResponse
> => {
  const response = await axios.get<
    | ApiHealthDbSuccessResponse
    | ApiHealthDbDsnErrorResponse
    | ApiHealthDbConnectionErrorResponse
  >(`${API_HEALTH_BASE_URL}/db`);

  return response.data;
};

/**
 * Fetches server health status from GET /api/health/server
 * @returns Promise resolving to server health response
 * @throws AxiosError if request fails
 */
const getServerHealth = async (): Promise<
  ApiHealthServerSuccessResponse | ApiHealthServerErrorResponse
> => {
  const response = await axios.get<
    ApiHealthServerSuccessResponse | ApiHealthServerErrorResponse
  >(`${API_HEALTH_BASE_URL}/server`);

  return response.data;
};

const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};

export { ApiHealthService };
