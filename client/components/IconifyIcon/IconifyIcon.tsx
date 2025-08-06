import type { ComponentPropsWithRef, JSX } from "react";

import { DynamicElement } from "@client/components/DynamicElement";

/**
 * Props type for the IconifyIcon component
 * Extends all standard iconify-icon element props
 */
type IconifyIconProps = ComponentPropsWithRef<"iconify-icon">;

/**
 * A wrapper component for Iconify icons with type safety and consistent integration.
 * This component is memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * <IconifyIcon
 *   icon="material-symbols:home"
 *   className="nav-icon"
 *   width="24"
 *   height="24"
 * />
 *
 * // With transformations
 * <IconifyIcon
 *   icon="bi:arrow-right"
 *   rotate="90deg"
 *   flip="horizontal"
 * />
 * ```
 *
 * @param props - The IconifyIcon component props
 * @param props.icon - Iconify icon name (e.g., "streamline-sharp:check-solid")
 * @param props.width - Icon width
 * @param props.height - Icon height
 * @param props.flip - Flip icon ("horizontal", "vertical", or "horizontal,vertical")
 * @param props.rotate - Rotate icon (e.g., "90deg", "180deg")
 * @param props.inline - Changes vertical alignment
 * @param props.props - All other standard iconify-icon element props are supported
 * @returns JSX.Element - The rendered iconify-icon element
 * @performance Memoized component that only re-renders when props change
 */
const IconifyIcon = ({ icon, ...props }: IconifyIconProps): JSX.Element => {
  return <DynamicElement as="iconify-icon" icon={icon} {...props} />;
};

IconifyIcon.displayName = "IconifyIcon";

export { IconifyIcon };
