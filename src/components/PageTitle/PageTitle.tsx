import type { JSX } from "react";

import styles from "./PageTitle.module.scss";

interface PageTitleProps {
  pageTitle: string;
}

const PageTitle = ({ pageTitle }: PageTitleProps): JSX.Element => {
  return <h2 className={styles["page-title"]}>{pageTitle}</h2>;
};

export { PageTitle };
