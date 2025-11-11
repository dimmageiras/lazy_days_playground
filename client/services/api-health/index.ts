import { ApiHealthQueriesHelper } from "./helpers/api-health-queries.helper";
import { useGetDatabaseHealth } from "./queries/useGetDatabaseHealth.query";
import { useGetServerHealth } from "./queries/useGetServerHealth.query";

const { getDatabaseHealthQueryOptions, getServerHealthQueryOptions } =
  ApiHealthQueriesHelper;

export {
  getDatabaseHealthQueryOptions,
  getServerHealthQueryOptions,
  useGetDatabaseHealth,
  useGetServerHealth,
};
