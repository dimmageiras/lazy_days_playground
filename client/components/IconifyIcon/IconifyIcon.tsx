import type { IconProps } from "@iconify/react";
import type { IconifyIcon as IconifyIconType } from "iconify-icon";
import type { ComponentPropsWithRef, JSX } from "react";

import { DynamicElement } from "@client/components/DynamicElement";

import { ServerIcon } from "./components/ServerIcon";
import type { IconifyIconName } from "./types/iconify-icon.type";

/**
 * Props interface for client-side rendering mode (default)
 */
interface IconifyIconProps
  extends Omit<ComponentPropsWithRef<"iconify-icon">, "icon"> {
  /** Iconify icon name or icon object (e.g., "material-symbols:home") */
  icon: string | IconifyIconType | undefined;
  /** Enables client-side rendering (default behavior) */
  ssr?: false;
}

/**
 * Props interface for server-side rendering mode
 */
interface IconifyIconSSRProps extends Omit<IconProps, "icon"> {
  /** Must be one of the predefined icon names from the icon registry */
  icon: IconifyIconName | undefined;
  /** Enables server-side rendering with React Query integration */
  ssr: true;
}

/**
 * A flexible icon component supporting both client-side and server-side rendering with type safety and consistent integration.
 * The component is optimized for performance using React.memo to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * // Client-side rendering (default)
 * <IconifyIcon
 *   className="nav-icon"
 *   height="24"
 *   icon="material-symbols:home"
 *   width="24"
 * />
 *
 * // Client-side with transformations
 * <IconifyIcon
 *   flip="horizontal"
 *   icon="bi:arrow-right"
 *   rotate="90deg"
 * />
 *
 * // Server-side rendering with predefined icon
 * <IconifyIcon
 *   className="server-icon"
 *   height="32"
 *   icon="home"
 *   ssr={true}
 *   width="32"
 * />
 *
 * // Server-side rendering with styling
 * <IconifyIcon
 *   icon="checkCircle"
 *   ssr={true}
 *   style={{ color: 'green' }}
 * />
 * ```
 *
 * @param props - The IconifyIcon component props (IconifyIconProps | IconifyIconSSRProps)
 * @param props.icon - Icon identifier: string/IconifyIcon object for client-side, predefined name for SSR
 * @param props.ssr - Rendering mode: false/undefined for client-side, true for server-side
 * @param props.[...iconProps] - All standard iconify-icon (client) or @iconify/react Icon (SSR) props are supported
 * @returns JSX.Element | null - The rendered icon component or null if no icon is provided
 */
const IconifyIcon = (
  props: IconifyIconProps | IconifyIconSSRProps
): JSX.Element | null => {
  if (props.icon == undefined) {
    console.warn("IconifyIcon: No icon provided");

    return null;
  }

  if (!props.ssr) {
    const { icon, ...rest } = props;

    return <DynamicElement as="iconify-icon" icon={icon} {...rest} />;
  }

  const { icon, ...rest } = props;

  return <ServerIcon icon={icon} {...rest} />;
};

IconifyIcon.displayName = "IconifyIcon";

export { IconifyIcon };
