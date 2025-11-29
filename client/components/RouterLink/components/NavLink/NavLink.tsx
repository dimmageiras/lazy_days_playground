import classNames from "classnames";
import type { JSX } from "react";
import type { To } from "react-router";
import { NavLink as ReactRouterNavLink } from "react-router";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface NavLinkProps extends CommonRouterLinkProps, CommonLinkProps {
  /** CSS class applied when NavLink is active */
  activeClassName?: string | undefined;
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
  /** Destination URL or route path */
  to: To;
}

const NavLink = ({
  activeClassName,
  children,
  className,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  ref,
  shouldReplace = false,
  to,
}: NavLinkProps): JSX.Element => {
  return (
    <ReactRouterNavLink
      className={({ isActive }): string =>
        classNames(className, {
          [String(activeClassName)]: isActive,
        })
      }
      onClick={onClick}
      ref={ref}
      to={to ?? ""}
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldReplace && { replace: true })}
    >
      {children}
    </ReactRouterNavLink>
  );
};

export { NavLink };
