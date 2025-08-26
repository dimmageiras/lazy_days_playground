import type { ComponentPropsWithRef, JSX } from "react";
import { memo } from "react";

import { DynamicElement } from "@client/components/DynamicElement";

/**
 * Props type for the IconifyIcon component.
 * Extends all standard iconify-icon element props for complete type safety.
 */
type IconifyIconProps = ComponentPropsWithRef<"iconify-icon">;

/**
 * A wrapper component for Iconify icons that provides type safety and consistent integration.
 * The component is optimized for performance using React.memo to prevent unnecessary re-renders when props haven't changed.
 *
 * @example
 * ```tsx
 * // Basic usage with size
 * <IconifyIcon
 *   className="nav-icon"
 *   height="24"
 *   icon="material-symbols:home"
 *   width="24"
 * />
 *
 * // With transformations
 * <IconifyIcon
 *   flip="horizontal"
 *   icon="bi:arrow-right"
 *   rotate="90deg"
 * />
 *
 * // With color and alignment
 * <IconifyIcon
 *   color="currentColor"
 *   icon="mdi:alert"
 *   inline={true}
 *   style={{ color: 'red' }}
 * />
 * ```
 *
 * @param props - The IconifyIcon component props
 * @param props.[...iconifyProps] - Any other valid iconify-icon element props
 * @param props.color - Icon color (optional, defaults to currentColor)
 * @param props.flip - Flip icon horizontally/vertically (optional, "horizontal", "vertical", or "horizontal,vertical")
 * @param props.height - Icon height (optional, in pixels or "auto" for original)
 * @param props.icon - Iconify icon name (required, e.g., "material-symbols:home")
 * @param props.inline - Changes vertical alignment (optional, boolean)
 * @param props.rotate - Rotate icon by degrees (optional, e.g., "90deg", "180deg")
 * @param props.width - Icon width (optional, in pixels or "auto" for original)
 * @returns JSX.Element - The rendered iconify-icon element
 */
const IconifyIcon = memo(
  ({ icon, ...props }: IconifyIconProps): JSX.Element => {
    return <DynamicElement as="iconify-icon" icon={icon} {...props} />;
  }
);

IconifyIcon.displayName = "IconifyIcon";

export { IconifyIcon };
