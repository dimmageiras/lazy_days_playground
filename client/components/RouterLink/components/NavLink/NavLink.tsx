import classNames from "classnames";
import type { ComponentProps, JSX, MouseEvent } from "react";
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

const preventNavigation = (event: MouseEvent): void => {
  event.preventDefault();
};

const NavLink = ({
  activeClassName,
  children,
  className,
  disabled,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  shouldReplace = false,
  ...restProps
}: NavLinkProps): JSX.Element => {
  return (
    <ReactRouterNavLink
      aria-disabled={disabled}
      className={({ isActive }): string =>
        classNames(className, {
          [String(activeClassName)]: isActive,
        })
      }
      {...(!disabled && prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(disabled ? { onClick: preventNavigation } : { onClick })}
      {...(shouldReplace && { replace: true })}
      {...restProps}
    >
      {children}
    </ReactRouterNavLink>
  );
};

export { NavLink };
