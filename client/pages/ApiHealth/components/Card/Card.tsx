import classNames from "classnames";
import type { JSX } from "react";
import type { KeyAsString } from "type-fest";

import { BaseCard } from "@client/components/BaseCard";
import { IconifyIcon } from "@client/components/IconifyIcon";
import { API_HEALTH_ENDPOINTS } from "@shared/constants/api.constant";
import type {
  ApiHealthDatabaseCheckResponse,
  ApiHealthServerCheckResponse,
} from "@shared/types/api-health.type";

import styles from "./Card.module.scss";
import { DatabaseMetadata } from "./components/DatabaseMetadata";
import { ServerMetadata } from "./components/ServerMetadata";

type CardApiHealthServiceKeys = KeyAsString<typeof API_HEALTH_ENDPOINTS>;

type CardApiHealthService =
  (typeof API_HEALTH_ENDPOINTS)[CardApiHealthServiceKeys];

interface CardBaseProps {
  apiHealthService: CardApiHealthService;
  isHealthy: boolean;
  isUnhealthy: boolean;
  status: string | undefined;
}

interface CardDatabaseProps extends CardBaseProps {
  apiHealthService: typeof API_HEALTH_ENDPOINTS.DATABASE;
  data: ApiHealthDatabaseCheckResponse | undefined;
  error: Error | null;
}

interface CardServerProps extends CardBaseProps {
  apiHealthService: typeof API_HEALTH_ENDPOINTS.SERVER;
  data: ApiHealthServerCheckResponse | undefined;
  error: Error | null;
}

const Card = ({
  apiHealthService,
  data,
  error,
  isHealthy,
  isUnhealthy,
  status,
}: CardDatabaseProps | CardServerProps): JSX.Element => {
  const icon =
    apiHealthService === API_HEALTH_ENDPOINTS.DATABASE
      ? "solar:database-linear"
      : "solar:server-square-linear";

  return (
    <BaseCard>
      <div className={styles["card-content"]}>
        <div className={styles["card-header"]}>
          <div className={styles["left-section"]}>
            <IconifyIcon className={styles["title-icon"]} icon={icon} ssr />
            <h2 className={styles["service-name"]}>{apiHealthService}</h2>
          </div>
          <div className={styles["right-section"]}>
            <div
              className={classNames(styles["status-indicator"], {
                [String(styles["healthy"])]: isHealthy,
                [String(styles["unhealthy"])]: isUnhealthy,
              })}
            >
              <IconifyIcon
                className={styles["status-icon"]}
                icon={
                  isHealthy
                    ? "material-symbols:check-circle"
                    : "material-symbols:error"
                }
                ssr
              />
              {status || "Unknown"}
            </div>
          </div>
        </div>
        {apiHealthService === API_HEALTH_ENDPOINTS.DATABASE ? (
          <DatabaseMetadata
            data={data}
            error={error}
            isHealthy={isHealthy}
            isUnhealthy={isUnhealthy}
          />
        ) : null}
        {apiHealthService === API_HEALTH_ENDPOINTS.SERVER ? (
          <ServerMetadata
            data={data}
            error={error}
            isHealthy={isHealthy}
            isUnhealthy={isUnhealthy}
          />
        ) : null}
      </div>
    </BaseCard>
  );
};

export { Card };
