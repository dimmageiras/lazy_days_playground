import type { ComponentProps, JSX } from "react";

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

const ExternalLink = ({
  children,
  handleMouseDown,
  prioritizeOnClick = false,
  shouldOpenInNewTab = false,
  to,
  ...restProps
}: ExternalLinkProps): JSX.Element => {
  return (
    <a
      href={to ?? ""}
      rel="noopener noreferrer"
      {...(prioritizeOnClick && { onMouseDown: handleMouseDown })}
      {...(shouldOpenInNewTab && { target: "_blank" })}
      {...restProps}
    >
      {children}
    </a>
  );
};

export { ExternalLink };
