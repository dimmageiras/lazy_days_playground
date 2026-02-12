import classNames from "classnames";
import type { JSX } from "react";

import { DomEventsHelper } from "@client/helpers/dom-events.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

import { ExternalLink } from "./components/ExternalLink";
import { InternalLink } from "./components/InternalLink";
import { NavLink } from "./components/NavLink";
import { LINK_AS } from "./constants/router-link.constant";
import styles from "./RouterLink.module.scss";
import type {
  CommonPropsToRemove,
  ExternalRouterLinkProps,
  InternalRouterLinkProps,
  NavRouterLinkProps,
} from "./types/router-link.type";

/**
 * Props interface for the RouterLink component.
 * Different props are applicable based on the link type (external, internal, or navLink).
 */
type RouterLinkProps =
  | ExternalRouterLinkProps
  | InternalRouterLinkProps
  | NavRouterLinkProps;

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
  const { castAsType } = TypeHelper;

  const {
    as = "external",
    className,
    hasTextDecorationOnHover = false,
    ...restProps
  } = props;

  const convertedType = Reflect.get(LINK_AS, as);

  const linkClassName = classNames(
    styles["link"],
    {
      [String(styles["hover-text-decoration"])]: hasTextDecorationOnHover,
    },
    className,
  );

  switch (convertedType) {
    case LINK_AS.internal:
      return (
        <InternalLink
          className={linkClassName}
          handleMouseDown={handleMouseDown}
          {...castAsType<Omit<InternalRouterLinkProps, CommonPropsToRemove>>(
            restProps,
          )}
        />
      );
    case LINK_AS.navLink:
      return (
        <NavLink
          className={linkClassName}
          handleMouseDown={handleMouseDown}
          {...castAsType<Omit<NavRouterLinkProps, CommonPropsToRemove>>(
            restProps,
          )}
        />
      );
    case LINK_AS.external:
    default:
      return (
        <ExternalLink
          className={linkClassName}
          handleMouseDown={handleMouseDown}
          {...castAsType<Omit<ExternalRouterLinkProps, CommonPropsToRemove>>(
            restProps,
          )}
        />
      );
  }
};

export { RouterLink };
