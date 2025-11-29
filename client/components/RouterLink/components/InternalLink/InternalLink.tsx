import type { JSX } from "react";
import type { To } from "react-router";
import { Link } from "react-router";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface InternalLinkProps extends CommonRouterLinkProps, CommonLinkProps {
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
  /** Destination URL or route path */
  to: To;
}

const InternalLink = ({
  children,
  className,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  ref,
  shouldReplace = false,
  to,
}: InternalLinkProps): JSX.Element => {
  return (
    <Link
      className={className}
      ref={ref}
      onClick={onClick}
      to={to ?? ""}
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldReplace && { replace: true })}
    >
      {children}
    </Link>
  );
};

export { InternalLink };
