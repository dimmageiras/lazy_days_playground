import classNames from "classnames";
import type { ComponentPropsWithRef, JSX } from "react";

import styles from "./PageTitle.module.scss";

/**
 * Props interface for the PageTitle component
 * Extends all standard h2 element props
 */
interface PageTitleProps extends ComponentPropsWithRef<"h2"> {
  /** The title text to display */
  pageTitle: string;
}

/**
 * A consistent page title component that renders as an h2 element with standardized styling.
 *
 * @example
 * ```tsx
 * <PageTitle pageTitle="User Dashboard" className="custom-title-style" />
 * ```
 *
 * @param props - The PageTitle component props
 * @param props.pageTitle - The title text to display
 * @param props.className - Additional CSS classes
 * @param props.props - All other standard h2 props are supported
 * @returns JSX.Element - The rendered h2 page title element
 */
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
