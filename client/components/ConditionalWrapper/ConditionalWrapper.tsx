import type { JSX, PropsWithChildren, ReactNode } from "react";

/**
 * Props interface for the ConditionalWrapper component
 */
interface ConditionalWrapperProps extends PropsWithChildren {
  /** Whether to apply the wrapper function to the children */
  shouldRender: boolean;
  /** Function that wraps the children when shouldRender is true */
  wrapper: (children: ReactNode) => JSX.Element;
}

/**
 * A utility component that conditionally wraps children with a wrapper function based on a boolean flag.
 * This component helps avoid duplicating JSX when you need to optionally wrap content in a container,
 * link, or other wrapping element based on a condition.
 *
 * When `shouldRender` is false, children are rendered as-is. When true, the `wrapper` function
 * is called with the children and its return value is rendered.
 *
 * @example
 * ```tsx
 * import { ConditionalWrapper } from '@client/components/ConditionalWrapper';
 * import { RouterLink } from '@client/components/RouterLink';
 *
 * // Conditionally wrap content in a tooltip
 * const ButtonWithOptionalTooltip = ({ showTooltip }) => (
 *   <ConditionalWrapper
 *     shouldRender={showTooltip}
 *     wrapper={(children) => <Tooltip content="More info">{children}</Tooltip>}
 *   >
 *     <button>Hover me</button>
 *   </ConditionalWrapper>
 * );
 *
 * // Conditionally wrap in a link
 * const CardWithOptionalLink = ({ isClickable, url }) => (
 *   <ConditionalWrapper
 *     shouldRender={isClickable}
 *     wrapper={(children) => (
 *       <RouterLink as="internal" to={url}>
 *         {children}
 *       </RouterLink>
 *     )}
 *   >
 *     <div className="card">Card content</div>
 *   </ConditionalWrapper>
 * );
 *
 * // Conditionally apply a styled container
 * const InputWithErrorContainer = ({ hasError }) => (
 *   <ConditionalWrapper
 *     shouldRender={hasError}
 *     wrapper={(children) => <div className="error-container">{children}</div>}
 *   >
 *     <TextInput label="Email" name="email" type="email" />
 *   </ConditionalWrapper>
 * );
 * ```
 *
 * @param props - The ConditionalWrapper component props
 * @param props.children - The content to be conditionally wrapped
 * @param props.shouldRender - Whether to apply the wrapper function (when false, renders children as-is)
 * @param props.wrapper - Function that wraps the children when shouldRender is true
 * @returns JSX.Element - Either the unwrapped children or the result of the wrapper function
 */
const ConditionalWrapper = ({
  children,
  shouldRender,
  wrapper,
}: ConditionalWrapperProps): JSX.Element => {
  if (!shouldRender) {
    return <>{children}</>;
  }

  return wrapper(children);
};

export { ConditionalWrapper };
