import type { ComponentProps, JSX, MouseEvent, Ref } from "react";
import type { ConditionalKeys } from "type-fest";

import type { ExternalLink } from "@client/components/RouterLink/components/ExternalLink";
import type { InternalLink } from "@client/components/RouterLink/components/InternalLink";
import type { NavLink } from "@client/components/RouterLink/components/NavLink";
import type { LINK_AS } from "@client/components/RouterLink/constants/router-link.constant";
import type { DomEventsHelper } from "@client/helpers/dom-events.helper";

interface CommonRouterLinkProps {
  /** Content to be rendered inside the link */
  children?: JSX.Element | string | null;
  /** Additional CSS classes for styling */
  className?: string | undefined;
  /** Whether to show text decoration on hover */
  hasTextDecorationOnHover?: boolean;
  /** onClick event handler */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  /** Whether to prioritize onClick event over other events */
  prioritizeOnClick?: boolean;
  /** Ref for accessing the underlying anchor element */
  ref?: Ref<HTMLAnchorElement | null>;
}

interface CommonLinkProps {
  /** handleMouseDown event handler */
  handleMouseDown: typeof DomEventsHelper.handleMouseDown;
}

interface ExternalRouterLinkProps
  extends Omit<ComponentProps<typeof ExternalLink>, keyof CommonLinkProps> {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.external>;
}

interface InternalRouterLinkProps
  extends Omit<ComponentProps<typeof InternalLink>, keyof CommonLinkProps> {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.internal>;
}

interface NavRouterLinkProps
  extends Omit<ComponentProps<typeof NavLink>, keyof CommonLinkProps> {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.navLink>;
}

type CommonPropsToRemove = "as" | "className" | "hasTextDecorationOnHover";

export type {
  CommonLinkProps,
  CommonPropsToRemove,
  CommonRouterLinkProps,
  ExternalRouterLinkProps,
  InternalRouterLinkProps,
  NavRouterLinkProps,
};
