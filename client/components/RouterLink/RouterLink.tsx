import classNames from "classnames";
import type { JSX, MouseEvent, Ref } from "react";
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
  /** onClick event handler */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Whether to prioritize onClick event over other events */
  prioritizeOnClick?: boolean;
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
 * A type-safe link component with three variants for handling both internal routing and external links.
 * Renders different elements based on the `as` prop: `<a>` for external links with security attributes,
 * React Router's `<Link>` for internal navigation, and `<NavLink>` for navigation with active state support.
 *
 * @example
 * ```tsx
 * import { RouterLink } from '@client/components/RouterLink';
 *
 * // External link opening in new tab with security attributes
 * <RouterLink as="external" shouldOpenInNewTab to="https://example.com">
 *   Visit Example
 * </RouterLink>
 *
 * // Internal link with onClick priority for better UX
 * <RouterLink as="internal" prioritizeOnClick to="/dashboard">
 *   Dashboard
 * </RouterLink>
 *
 * // Navigation link with active state styling
 * <RouterLink as="navLink" activeClassName="nav-active" to="/profile">
 *   Profile
 * </RouterLink>
 *
 * // Internal link replacing current history entry
 * <RouterLink as="internal" shouldReplace to="/settings">
 *   Settings
 * </RouterLink>
 * ```
 *
 * @param props - The RouterLink component props (ExternalLinkProps | InternalLinkProps | NavLinkProps)
 * @param props.activeClassName - CSS class applied when NavLink is active (navLink only)
 * @param props.as - Link type that determines the rendered component ("external" | "internal" | "navLink")
 * @param props.children - Content to be rendered inside the link
 * @param props.className - Additional CSS classes for styling
 * @param props.hasTextDecorationOnHover - Whether to show text decoration on hover (default: false)
 * @param props.onClick - onClick event handler
 * @param props.prioritizeOnClick - Whether to prioritize onClick event over other events (default: false)
 * @param props.ref - Ref for accessing the underlying anchor element
 * @param props.shouldOpenInNewTab - Whether to open external link in new tab (external only)
 * @param props.shouldReplace - Whether to replace current history entry instead of pushing (internal/navLink only)
 * @param props.to - Destination URL (external) or route path/config (internal/navLink)
 * @returns JSX.Element - The rendered link component: `<a>`, `<Link>`, or `<NavLink>` based on 'as' prop
 */
const RouterLink = (props: RouterLinkProps): JSX.Element => {
  const { handleMouseDown } = DomEventsHelper;

  const {
    as = "external",
    children = null,
    className,
    hasTextDecorationOnHover = false,
    onClick,
    prioritizeOnClick = false,
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
      return (
        <Link
          className={linkClassNames}
          ref={ref}
          onClick={onClick}
          to={"to" in props && typeof props.to === "string" ? props.to : ""}
          {...("shouldReplace" in props &&
            props.shouldReplace && { replace: !!props.shouldReplace })}
          {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
        >
          {children}
        </Link>
      );
    }

    case LINK_AS.navLink: {
      return (
        <NavLink
          className={({ isActive }): string =>
            classNames(linkClassNames, {
              ...("activeClassName" in props && {
                [String(props.activeClassName)]: isActive,
              }),
            })
          }
          onClick={onClick}
          ref={ref}
          to={"to" in props && typeof props.to === "string" ? props.to : ""}
          {...("shouldReplace" in props &&
            props.shouldReplace && { replace: !!props.shouldReplace })}
          {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
        >
          {children}
        </NavLink>
      );
    }

    case LINK_AS.external:
    default: {
      return (
        <a
          className={linkClassNames}
          href={
            "to" in props && typeof props.to === "string" ? props.to : undefined
          }
          onClick={onClick}
          ref={ref}
          rel="noopener noreferrer"
          {...("shouldOpenInNewTab" in props &&
            props.shouldOpenInNewTab && { target: "_blank" })}
          {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
        >
          {children}
        </a>
      );
    }
  }
};

export { RouterLink };
