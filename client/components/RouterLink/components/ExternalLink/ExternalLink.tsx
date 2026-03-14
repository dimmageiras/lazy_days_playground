import type { ComponentProps, JSX, MouseEvent } from "react";

import type {
  CommonLinkProps,
  CommonRouterLinkProps,
} from "@client/components/RouterLink/types/router-link.type";

interface ExternalLinkProps
  extends
    Omit<ComponentProps<"a">, "href" | "onMouseDown" | "rel" | "target">,
    CommonLinkProps,
    CommonRouterLinkProps {
  /** Whether to open link in new tab */
  shouldOpenInNewTab?: boolean;
  /** Destination URL */
  to?: string | undefined;
}

const preventNavigation = (event: MouseEvent): void => {
  event.preventDefault();
};

const ExternalLink = ({
  children,
  disabled,
  handleMouseDown,
  onClick,
  prioritizeOnClick = false,
  shouldOpenInNewTab = false,
  to,
  ...restProps
}: ExternalLinkProps): JSX.Element => {
  return (
    <a
      aria-disabled={disabled}
      href={to ?? ""}
      rel="noopener noreferrer"
      {...(!disabled && prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(disabled ? { onClick: preventNavigation } : { onClick })}
      {...(shouldOpenInNewTab && { target: "_blank" })}
      {...restProps}
    >
      {children}
    </a>
  );
};

export { ExternalLink };
