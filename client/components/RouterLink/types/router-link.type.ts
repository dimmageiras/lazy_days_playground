import type { ComponentProps } from "react";
import type { ConditionalKeys, KeyAsString } from "type-fest";

import type { ExternalLink } from "@client/components/RouterLink/components/ExternalLink";
import type { InternalLink } from "@client/components/RouterLink/components/InternalLink";
import type { NavLink } from "@client/components/RouterLink/components/NavLink";
import type { LINK_AS } from "@client/components/RouterLink/constants/router-link.constant";
import type { DomEventsHelper } from "@client/helpers/dom-events.helper";

interface CommonRouterLinkProps {
  /** Whether to show text decoration on hover */
  hasTextDecorationOnHover?: boolean;
  /** Whether to prioritize onClick event over other events */
  prioritizeOnClick?: boolean;
}

interface CommonLinkProps {
  /** handleMouseDown event handler */
  handleMouseDown: typeof DomEventsHelper.handleMouseDown;
}

interface ExternalRouterLinkProps
  extends Omit<
    ComponentProps<typeof ExternalLink>,
    KeyAsString<CommonLinkProps>
  > {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.external>;
}

interface InternalRouterLinkProps
  extends Omit<
    ComponentProps<typeof InternalLink>,
    KeyAsString<CommonLinkProps>
  > {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.internal>;
}

interface NavRouterLinkProps
  extends Omit<ComponentProps<typeof NavLink>, KeyAsString<CommonLinkProps>> {
  as?: ConditionalKeys<typeof LINK_AS, typeof LINK_AS.navLink>;
}

type CommonPropsToRemove = "as" | "hasTextDecorationOnHover";

export type {
  CommonLinkProps,
  CommonPropsToRemove,
  CommonRouterLinkProps,
  ExternalRouterLinkProps,
  InternalRouterLinkProps,
  NavRouterLinkProps,
};
