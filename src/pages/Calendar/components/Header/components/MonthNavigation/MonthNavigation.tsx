import classNames from "classnames";
import dayjs from "dayjs";
import type { JSX, PropsWithChildren } from "react";

import { IconifyIcon } from "~/components/IconifyIcon";

import styles from "./MonthNavigation.module.scss";

const MonthNavigation = ({ children }: PropsWithChildren): JSX.Element => {
  const currentDate = dayjs();

  return (
    <>
      <button
        className={classNames(
          styles["month-navigation-button"],
          styles["previous"]
        )}
        disabled={currentDate.isSame(dayjs(), "month")}
        type="button"
      >
        <IconifyIcon icon="typcn:arrow-left-thick" />
      </button>
      {children}
      <button className={styles["month-navigation-button"]} type="button">
        <IconifyIcon icon="typcn:arrow-right-thick" />
      </button>
    </>
  );
};

export { MonthNavigation };
