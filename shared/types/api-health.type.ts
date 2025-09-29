import type {
  HealthDatabaseListData,
  HealthDatabaseListError,
  HealthServerListData,
  HealthServerListError,
} from "./generated/api-health.type";

type HealthDatabaseListResponse =
  | HealthDatabaseListData
  | HealthDatabaseListError;

type HealthServerListResponse = HealthServerListData | HealthServerListError;

export type { HealthDatabaseListResponse, HealthServerListResponse };
