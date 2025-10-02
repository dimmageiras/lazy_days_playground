import type { JSX } from "react";

import { IconifyIcon } from "@client/components/IconifyIcon";
import { DateHelper } from "@shared/helpers/date.helper";
import type { HealthServerListData } from "@shared/types/generated/api-health.type";

import styles from "./ServerMetadata.module.scss";

interface ServerMetadataProps {
  data: HealthServerListData | undefined;
  isHealthy: boolean;
}

const ServerMetadata = ({
  data,
  isHealthy,
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
    </>
  );
};

export { ServerMetadata };
