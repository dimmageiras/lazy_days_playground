import classNames from "classnames";
import type { ComponentProps, JSX } from "react";
import { NavLink as ReactRouterNavLink } from "react-router";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface NavLinkProps
  extends Omit<
      ComponentProps<typeof ReactRouterNavLink>,
      "onMouseDown" | "replace"
    >,
    CommonRouterLinkProps,
    CommonLinkProps {
  /** CSS class applied when NavLink is active */
  activeClassName?: string | undefined;
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
}

const NavLink = ({
  activeClassName,
  children,
  className,
  handleMouseDown,
  prioritizeOnClick = false,
  shouldReplace = false,
  ...restProps
}: NavLinkProps): JSX.Element => {
  return (
    <ReactRouterNavLink
      className={({ isActive }): string =>
        classNames(className, {
          [String(activeClassName)]: isActive,
        })
      }
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldReplace && { replace: true })}
      {...restProps}
    >
      {children}
    </ReactRouterNavLink>
  );
};

export { NavLink };
