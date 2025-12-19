import type { ComponentProps, JSX } from "react";
import { Link } from "react-router";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface InternalLinkProps
  extends Omit<ComponentProps<typeof Link>, "onMouseDown" | "replace">,
    CommonRouterLinkProps,
    CommonLinkProps {
  /** Whether to replace current history entry instead of pushing */
  shouldReplace?: boolean;
}

const InternalLink = ({
  children,
  handleMouseDown,
  prioritizeOnClick = false,
  shouldReplace = false,
  ...restProps
}: InternalLinkProps): JSX.Element => {
  return (
    <Link
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldReplace && { replace: true })}
      {...restProps}
    >
      {children}
    </Link>
  );
};

export { InternalLink };
