import type { JSX } from "react";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface ExternalLinkProps extends CommonRouterLinkProps, CommonLinkProps {
  /** Whether to open link in new tab */
  shouldOpenInNewTab?: boolean;
  /** Destination URL */
  to?: string | undefined;
}

const ExternalLink = ({
  children,
  className,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  ref,
  shouldOpenInNewTab = false,
  to,
}: ExternalLinkProps): JSX.Element => {
  return (
    <a
      className={className}
      href={to ?? ""}
      onClick={onClick}
      ref={ref}
      rel="noopener noreferrer"
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldOpenInNewTab && { target: "_blank" })}
    >
      {children}
    </a>
  );
};

export { ExternalLink };
