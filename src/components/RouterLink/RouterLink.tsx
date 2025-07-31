import classNames from "classnames";
import type { JSX, Ref } from "react";
import { Link, NavLink } from "react-router";

import { LINK_AS } from "./router-link.constants";
import styles from "./RouterLink.module.scss";

/**
 * Props interface for the RouterLink component
 */
interface RouterLinkProps {
  /** CSS class for active NavLink */
  activeClassName?: string;
  /** Link type (default: 'external') */
  as?: keyof typeof LINK_AS;
  /** Link content */
  children?: JSX.Element | string | null;
  /** Additional CSS classes */
  className?: string;
  /** Show underline on hover (default: false) */
  hasTextDecorationOnHover?: boolean;
  /** Ref for the anchor element */
  ref?: Ref<HTMLAnchorElement | null>;
  /** Open external links in new tab (default: false) */
  shouldOpenInNewTab?: boolean;
  /** Replace current history entry (default: false) */
  shouldReplace?: boolean;
  /** The destination URL or route */
  to: string;
}

/**
 * A flexible link component that handles both internal routing and external links with consistent styling and behavior.
 *
 * @example
 * ```tsx
 * // External link
 * <RouterLink to="https://example.com" shouldOpenInNewTab>
 *   Visit Example
 * </RouterLink>
 *
 * // Internal route
 * <RouterLink as="internal" to="/dashboard">
 *   Go to Dashboard
 * </RouterLink>
 *
 * // Navigation link with active state
 * <RouterLink
 *   as="navLink"
 *   to="/profile"
 *   activeClassName="active-nav-item"
 * >
 *   Profile
 * </RouterLink>
 * ```
 *
 * @param props - The RouterLink component props
 * @param props.to - The destination URL or route
 * @param props.as - Link type (default: 'external')
 * @param props.children - Link content
 * @param props.className - Additional CSS classes
 * @param props.activeClassName - CSS class for active NavLink
 * @param props.hasTextDecorationOnHover - Show underline on hover (default: false)
 * @param props.shouldOpenInNewTab - Open external links in new tab (default: false)
 * @param props.shouldReplace - Replace current history entry (default: false)
 * @param props.ref - Ref for the anchor element
 * @returns JSX.Element - The rendered link component (a, Link, or NavLink based on type)
 */
const RouterLink = ({
  activeClassName,
  as = "external",
  children = null,
  className,
  hasTextDecorationOnHover = false,
  ref,
  shouldOpenInNewTab = false,
  shouldReplace = false,
  to,
}: RouterLinkProps): JSX.Element => {
  const convertedType = Reflect.get(LINK_AS, as);

  const linkClassNames = classNames(
    styles["link"],
    {
      [String(styles["hover-text-decoration"])]: hasTextDecorationOnHover,
    },
    className
  );

  switch (convertedType) {
    case LINK_AS.internal:
      return (
        <Link
          className={linkClassNames}
          ref={ref}
          replace={shouldReplace}
          to={to}
        >
          {children}
        </Link>
      );

    case LINK_AS.navLink:
      return (
        <NavLink
          className={({ isActive }): string =>
            classNames(linkClassNames, {
              [String(activeClassName)]: isActive,
            })
          }
          ref={ref}
          replace={shouldReplace}
          to={to}
        >
          {children}
        </NavLink>
      );

    case LINK_AS.external:
    default:
      return (
        <a
          className={linkClassNames}
          href={to}
          ref={ref}
          rel="noopener noreferrer"
          {...(shouldOpenInNewTab && { target: "_blank" })}
        >
          {children}
        </a>
      );
  }
};

export { RouterLink };
