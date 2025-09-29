import type { JSX } from "react";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { DateHelper } from "@shared/helpers/date.helper";
import type { HealthServerListResponse } from "@shared/types/api-health.type";

import styles from "./ServerMetadata.module.scss";

interface ServerMetadataProps {
  data: HealthServerListResponse | undefined;
  error: Error | null;
  isHealthy: boolean;
  isUnhealthy: boolean;
}

const ServerMetadata = ({
  data,
  error,
  isHealthy,
  isUnhealthy,
}: ServerMetadataProps): JSX.Element => {
  const { formatTimestampForDisplay } = DateHelper;

  return (
    <>
      {isHealthy && data && "service" in data ? (
        <div className={styles["metadata"]}>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:info"
              ssr
            />
            {`Service: ${data.service}`}
          </div>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:schedule"
              ssr
            />
            {`Last checked: ${formatTimestampForDisplay(data.timestamp)}`}
          </div>
        </div>
      ) : null}
      {isUnhealthy && data && "error" in data ? (
        <div className={styles["error-details"]}>
          <strong>Error:</strong>&nbsp;{data.error}
        </div>
      ) : null}
      {error ? (
        <div className={styles["error-details"]}>
          <strong>Connection Error:</strong>&nbsp;
          {error.message}
        </div>
      ) : null}
    </>
  );
};

export { ServerMetadata };
