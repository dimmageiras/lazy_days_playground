import type { ComponentProps, JSX, MouseEvent } from "react";
import { Link } from "react-router";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface InternalLinkProps
  extends
    Omit<ComponentProps<typeof Link>, "onMouseDown" | "replace">,
    CommonRouterLinkProps,
    CommonLinkProps {
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
}

const preventNavigation = (event: MouseEvent): void => {
  event.preventDefault();
};

const InternalLink = ({
  children,
  disabled,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  shouldReplace = false,
  ...restProps
}: InternalLinkProps): JSX.Element => {
  return (
    <Link
      aria-disabled={disabled}
      {...(!disabled && prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(disabled ? { onClick: preventNavigation } : { onClick })}
      {...(shouldReplace && { replace: true })}
      {...restProps}
    >
      {children}
    </Link>
  );
};

export { InternalLink };
