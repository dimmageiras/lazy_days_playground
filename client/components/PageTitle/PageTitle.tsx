import classNames from "classnames";
import type { ComponentPropsWithRef, JSX } from "react";

import styles from "./PageTitle.module.scss";

/**
 * Props interface for the PageTitle component.
 * Extends all standard h2 element props for accessibility and DOM attributes.
 */
interface PageTitleProps extends ComponentPropsWithRef<"h2"> {
  /** The title text to display in the heading */
  pageTitle: string;
}

/**
 * A semantic page title component that renders as an h2 element with consistent styling.
 * Provides standardized heading appearance while allowing customization through
 * standard h2 attributes and additional CSS classes.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <PageTitle pageTitle="User Dashboard" />
 *
 * // With custom styling
 * <PageTitle
 *   className="dashboard-title"
 *   pageTitle="Welcome Back"
 * />
 *
 * // With ARIA attributes
 * <PageTitle
 *   aria-label="Dashboard Overview"
 *   id="page-heading"
 *   pageTitle="Dashboard"
 * />
 * ```
 *
 * @param props - The PageTitle component props
 * @param props.[...h2Props] - Any valid h2 element props (e.g., id, aria-*, etc.)
 * @param props.className - Additional CSS classes (optional)
 * @param props.pageTitle - The title text to display in the heading
 * @returns JSX.Element - The rendered h2 heading element with applied styles
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
