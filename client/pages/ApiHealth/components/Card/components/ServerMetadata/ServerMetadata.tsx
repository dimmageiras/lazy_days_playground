import { type JSX } from "react";

import { IconifyIcon } from "@client/components/IconifyIcon";
import type {
  ApiHealthServerErrorResponse,
  ApiHealthServerSuccessResponse,
} from "@shared/types/api-health.type";

import styles from "./ServerMetadata.module.scss";

interface ServerMetadataProps {
  data:
    | ApiHealthServerSuccessResponse
    | ApiHealthServerErrorResponse
    | undefined;
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
  return (
    <>
      {isHealthy && data && "service" in data ? (
        <div className={styles["metadata"]}>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:info"
            />
            {`Service: ${data.service}`}
          </div>
          <div className={styles["meta-item"]}>
            <IconifyIcon
              className={styles["meta-icon"]}
              icon="material-symbols:schedule"
            />
            {`Last checked: ${new Date(data.timestamp).toLocaleString()}`}
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
