import classNames from "classnames";
import type { HTMLAttributes, JSX, RefAttributes } from "react";

import styles from "./PageTitle.module.scss";

interface PageTitleProps
  extends HTMLAttributes<HTMLHeadingElement>,
    RefAttributes<HTMLHeadingElement> {
  pageTitle: string;
}

const PageTitle = ({
  className,
  pageTitle,
  ...props
}: PageTitleProps): JSX.Element => {
  return (
    <h2 className={classNames(styles["page-title"], className)} {...props}>
      {pageTitle}
    </h2>
  );
};

export { PageTitle };
