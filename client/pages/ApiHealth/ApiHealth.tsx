import type { JSX } from "react";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { PageTitle } from "@client/components/PageTitle";
import {
  API_HEALTH_ENDPOINTS,
  API_HEALTH_STATUSES,
} from "@shared/constants/api-health.constant";

import styles from "./ApiHealth.module.scss";
import { Card } from "./components/Card";
import { useGetDatabaseHealth } from "./queries/useGetDatabaseHealth.query";
import { useGetServerHealth } from "./queries/useGetServerHealth.query";

const ApiHealth = (): JSX.Element => {
  const { isLoading: isLoadingDatabaseHealth, ...databaseHealthQuery } =
    useGetDatabaseHealth();
  const { isLoading: isLoadingServerHealth, ...serverHealthQuery } =
    useGetServerHealth();

  const { HEALTHY, UNHEALTHY } = API_HEALTH_STATUSES;

  const isHealthyDatabaseHealth = databaseHealthQuery.data?.status === HEALTHY;
  const isUnhealthyDatabaseHealth =
    databaseHealthQuery.data?.status === UNHEALTHY;

  const isHealthyServerHealth = serverHealthQuery.data?.status === HEALTHY;
  const isUnhealthyServerHealth = serverHealthQuery.data?.status === UNHEALTHY;

  const isLoading = isLoadingDatabaseHealth || isLoadingServerHealth;

  if (isLoading) {
    return (
      <main className={styles["api-health"]}>
        <PageTitle aria-label="Page title" pageTitle="API Health Status" />
        <section aria-label="Health cards" className={styles["health-cards"]}>
          <div className={styles["loading-state"]}>
            <IconifyIcon
              className={styles["loading-icon"]}
              icon="eos-icons:loading"
            />
            <p className={styles["loading-text"]}>Checking system health...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles["api-health"]}>
      <PageTitle aria-label="Page title" pageTitle="API Health Status" />
      <section aria-label="Health cards" className={styles["health-cards"]}>
        <Card
          apiHealthService={API_HEALTH_ENDPOINTS.DATABASE}
          data={databaseHealthQuery.data}
          error={databaseHealthQuery.error}
          isHealthy={isHealthyDatabaseHealth}
          isUnhealthy={isUnhealthyDatabaseHealth}
          status={databaseHealthQuery.data?.status}
        />
        <Card
          apiHealthService={API_HEALTH_ENDPOINTS.SERVER}
          data={serverHealthQuery.data}
          error={serverHealthQuery.error}
          isHealthy={isHealthyServerHealth}
          isUnhealthy={isUnhealthyServerHealth}
          status={serverHealthQuery.data?.status}
        />
      </section>
    </main>
  );
};

export { ApiHealth };
