import type { JSX } from "react";

import { PageTitle } from "@client/components/PageTitle";
import { ApiHealthQueries } from "@client/services/api-health";
import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";

import styles from "./ApiHealth.module.scss";
import { Card } from "./components/Card";

const ApiHealth = (): JSX.Element => {
  const { useGetDatabaseHealth, useGetServerHealth } = ApiHealthQueries;

  const {
    data: databaseHealthData,
    error: databaseHealthError,
    status: databaseHealthStatus,
  } = useGetDatabaseHealth();
  const {
    data: serverHealthData,
    error: serverHealthError,
    status: serverHealthStatus,
  } = useGetServerHealth();

  const isHealthyDatabaseHealth = databaseHealthStatus === "success";
  const isUnhealthyDatabaseHealth = databaseHealthStatus === "error";
  const isHealthyServerHealth = serverHealthStatus === "success";
  const isUnhealthyServerHealth = serverHealthStatus === "error";

  return (
    <main className={styles["api-health"]}>
      <PageTitle aria-label="Page title" pageTitle="API Health Status" />
      <section aria-label="Health cards" className={styles["health-cards"]}>
        <Card
          apiHealthService={API_HEALTH_ENDPOINTS.DATABASE}
          data={databaseHealthData}
          error={databaseHealthError}
          isHealthy={isHealthyDatabaseHealth}
          isUnhealthy={isUnhealthyDatabaseHealth}
          status={databaseHealthStatus}
        />
        <Card
          apiHealthService={API_HEALTH_ENDPOINTS.SERVER}
          data={serverHealthData}
          error={serverHealthError}
          isHealthy={isHealthyServerHealth}
          isUnhealthy={isUnhealthyServerHealth}
          status={serverHealthStatus}
        />
      </section>
    </main>
  );
};

export { ApiHealth };
