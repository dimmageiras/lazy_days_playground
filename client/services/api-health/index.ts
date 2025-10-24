import { useGetDatabaseHealth } from "./queries/useGetDatabaseHealth.query";
import { useGetServerHealth } from "./queries/useGetServerHealth.query";

export const ApiHealthQueries = {
  useGetDatabaseHealth,
  useGetServerHealth,
};
