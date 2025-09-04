import type { JSX } from "react";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { DateHelper } from "@client/helpers/date.helper";
import type { ApiHealthDatabaseCheckResponse } from "@shared/types/api-health.type";

import styles from "./DatabaseMetadata.module.scss";

interface DatabaseMetadataProps {
  data: ApiHealthDatabaseCheckResponse | undefined;
  error: Error | null;
  isHealthy: boolean;
  isUnhealthy: boolean;
}

const DatabaseMetadata = ({
  data,
  error,
  isHealthy,
  isUnhealthy,
}: DatabaseMetadataProps): JSX.Element => {
  const { formatTimestampForDisplay } = DateHelper;

  return (
    <>
      {isHealthy && data && "database" in data ? (
        <div className={styles["metadata"]}>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:info"
              ssr
            />
            {`Engine: ${data.database}`}
          </div>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:link"
              ssr
            />
            {`DSN: ${data.dsn}`}
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
          {"details" in data ? (
            <>
              <br />
              <strong>Details:</strong>&nbsp;
              {data.details}
            </>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <div className={styles["error-details"]}>
          <strong>Connection Error:</strong>
          &nbsp;{error.message}
        </div>
      ) : null}
    </>
  );
};

export { DatabaseMetadata };
