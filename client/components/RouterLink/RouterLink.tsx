import classNames from "classnames";
import type { JSX, Ref } from "react";
import type { Path } from "react-router";
import { Link, NavLink } from "react-router";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";

import { LINK_AS } from "./constants/router-link.constant";
import styles from "./RouterLink.module.scss";

interface CommonLinkProps {
  /** Content to be rendered inside the link */
  children?: JSX.Element | string | null;
  /** Additional CSS classes for styling */
  className?: string | undefined;
  /** Whether to show text decoration on hover */
  hasTextDecorationOnHover?: boolean;
  /** Ref for accessing the underlying anchor element */
  ref?: Ref<HTMLAnchorElement | null>;
}

interface ExternalLinkProps extends CommonLinkProps {
  /** Link type that determines the rendered component:
   * - 'external': Regular <a> tag with security attributes
   */
  as?: "external";
  /** Whether to open link in new tab */
  shouldOpenInNewTab?: boolean;
  /** Destination URL */
  to?: string | undefined;
}

interface InternalLinkProps extends CommonLinkProps {
  /** Link type that determines the rendered component:
   * - 'internal': React Router's <Link> for client-side navigation
   */
  as: "internal";
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
  /** Destination URL or route path */
  to: string | Partial<Path>;
}

interface NavLinkProps extends CommonLinkProps {
  /** CSS class applied when NavLink is active */
  activeClassName?: string | undefined;
  /** Link type that determines the rendered component:
   * - 'navLink': React Router's <NavLink> with active state support
   */
  as: "navLink";
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
  /** Destination URL or route path */
  to: string | Partial<Path>;
}

/**
 * Props interface for the RouterLink component.
 * Different props are applicable based on the link type (external, internal, or navLink).
 */
type RouterLinkProps = ExternalLinkProps | InternalLinkProps | NavLinkProps;

/**
 * A type-safe link component with three distinct variants:
 * 1. External links (`as="external"`): Regular anchor tags with security attributes
 * 2. Internal links (`as="internal"`): React Router Links for client-side navigation
 * 3. Nav links (`as="navLink"`): React Router NavLinks with active state support
 *
 * The component uses discriminated union types with 'as' prop as the discriminator,
 * ensuring type-safe prop combinations for each variant.
 *
 * @example
 * ```tsx
 * // External link (type-safe props for external variant)
 * <RouterLink
 *   as="external"
 *   shouldOpenInNewTab
 *   to="https://example.com"
 * >
 *   External Link
 * </RouterLink>
 *
 * // Internal link (type-safe props for internal variant)
 * <RouterLink
 *   as="internal"
 *   shouldReplace
 *   to={{ pathname: "/settings", search: "?tab=profile" }}
 * >
 *   Settings
 * </RouterLink>
 *
 * // Navigation link (type-safe props for navLink variant)
 * <RouterLink
 *   activeClassName="active"
 *   as="navLink"
 *   className="nav-link"
 *   to="/profile"
 * >
 *   Profile
 * </RouterLink>
 * ```
 *
 * Common props across all variants:
 * - children: Content to render inside the link
 * - className: Additional CSS classes
 * - hasTextDecorationOnHover: Enable hover underline effect
 * - ref: Ref for the anchor element
 *
 * Variant-specific props:
 * External (as="external"):
 * - shouldOpenInNewTab: Whether to open in new tab
 * - to: URL string
 *
 * Internal (as="internal"):
 * - shouldReplace: Whether to replace history entry
 * - to: Route path (string or Path object)
 *
 * NavLink (as="navLink"):
 * - activeClassName: CSS class for active state
 * - shouldReplace: Whether to replace history entry
 * - to: Route path (string or Path object)
 *
 * @param props - Union of ExternalLinkProps | InternalLinkProps | NavLinkProps
 * @returns JSX.Element - Rendered as <a>, <Link>, or <NavLink> based on 'as' prop
 */
const RouterLink = (props: RouterLinkProps): JSX.Element => {
  const { handleMouseDown } = DomEventsHelper;

  const {
    as = "external",
    children = null,
    className,
    hasTextDecorationOnHover = false,
    ref,
  } = props;

  const convertedType = Reflect.get(LINK_AS, as);

  const linkClassNames = classNames(
    styles["link"],
    {
      [String(styles["hover-text-decoration"])]: hasTextDecorationOnHover,
    },
    className
  );

  switch (convertedType) {
    case LINK_AS.internal: {
      const { shouldReplace, to } = props as InternalLinkProps;

      return (
        <Link
          className={linkClassNames}
          ref={ref}
          replace={!!shouldReplace}
          to={to}
        >
          {children}
        </Link>
      );
    }

    case LINK_AS.navLink: {
      const { activeClassName, shouldReplace, to } = props as NavLinkProps;

      return (
        <NavLink
          className={({ isActive }): string =>
            classNames(linkClassNames, {
              [String(activeClassName)]: isActive,
            })
          }
          onMouseDown={handleMouseDown}
          ref={ref}
          replace={!!shouldReplace}
          to={to}
        >
          {children}
        </NavLink>
      );
    }

    case LINK_AS.external:
    default: {
      const { shouldOpenInNewTab, to } = props as ExternalLinkProps;

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
  }
};

export { RouterLink };
