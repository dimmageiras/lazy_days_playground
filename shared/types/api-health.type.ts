interface ApiHealthBaseResponse {
  timestamp: string;
}

interface ApiHealthDatabaseSuccessResponse extends ApiHealthBaseResponse {
  database: string;
  dsn: string;
  test_result: unknown;
}

interface ApiHealthDatabaseDsnErrorResponse extends ApiHealthBaseResponse {
  error: string;
}

interface ApiHealthDatabaseConnectionErrorResponse
  extends ApiHealthBaseResponse {
  details: string;
  error: string;
}

type ApiHealthDatabaseCheckResponse =
  | ApiHealthDatabaseConnectionErrorResponse
  | ApiHealthDatabaseDsnErrorResponse
  | ApiHealthDatabaseSuccessResponse;

interface ApiHealthServerSuccessResponse extends ApiHealthBaseResponse {
  service: string;
}

interface ApiHealthServerErrorResponse extends ApiHealthBaseResponse {
  error: string;
}

type ApiHealthServerCheckResponse =
  | ApiHealthServerErrorResponse
  | ApiHealthServerSuccessResponse;

export type {
  ApiHealthDatabaseCheckResponse,
  ApiHealthDatabaseConnectionErrorResponse,
  ApiHealthDatabaseDsnErrorResponse,
  ApiHealthDatabaseSuccessResponse,
  ApiHealthServerCheckResponse,
  ApiHealthServerErrorResponse,
  ApiHealthServerSuccessResponse,
};
