import axios from "axios";

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
 */

const BASE_URL = "/api/health";

/**
 * Fetches database health status
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
  >(`${BASE_URL}/db`);

  return response.data;
};

/**
 * Fetches server health status
 * @returns Promise resolving to server health response
 * @throws AxiosError if request fails
 */
const getServerHealth = async (): Promise<
  ApiHealthServerSuccessResponse | ApiHealthServerErrorResponse
> => {
  const response = await axios.get<
    ApiHealthServerSuccessResponse | ApiHealthServerErrorResponse
  >(`${BASE_URL}/server`);

  return response.data;
};

const ApiHealthService = {
  getDatabaseHealth,
  getServerHealth,
};

export { ApiHealthService };
