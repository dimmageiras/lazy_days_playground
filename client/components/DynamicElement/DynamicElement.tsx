import type { CustomHtmlTags } from "html-tags";
import type {
  ComponentPropsWithRef,
  ElementType,
  JSX,
  PropsWithChildren,
} from "react";

import { DynamicElementHelper } from "./helpers/dynamic-element.helper";

/**
 * Props type for the DynamicElement component
 * @template TElement - The HTML tag type to render
 */
type DynamicElementProps<TElement extends CustomHtmlTags> = PropsWithChildren<
  ComponentPropsWithRef<TElement>
> & {
  /** The HTML tag to render */
  as: TElement;
};

/**
 * A type-safe component for rendering dynamic HTML elements, including custom elements like iconify-icon.
 * The component uses a memoized helper function to validate HTML tags for better performance.
 *
 * @example
 * ```tsx
 * // Basic div
 * <DynamicElement as="div" className="wrapper">
 *   Content here
 * </DynamicElement>
 *
 * // Icon element
 * <DynamicElement as="iconify-icon" icon="material-symbols:star" />
 *
 * // Section with role
 * <DynamicElement as="section" role="banner">
 *   <h1>Page Header</h1>
 * </DynamicElement>
 * ```
 *
 * @template TElement - The HTML tag type to render
 * @param props - The DynamicElement component props
 * @param props.[...elementProps] - Any valid props for the specified HTML element type
 * @param props.as - The HTML tag to render (must be a valid custom HTML tag)
 * @param props.children - Optional child content to render inside the element
 * @returns JSX.Element - The rendered dynamic element with the specified tag and props
 * @throws {Error} When the provided 'as' prop is not a valid custom HTML tag
 */
const DynamicElement = <TElement extends CustomHtmlTags>({
  children,
  as,
  ...props
}: DynamicElementProps<TElement>): JSX.Element => {
  const { getCustomTags } = DynamicElementHelper;
  const customTags: CustomHtmlTags[] = getCustomTags();

  if (!customTags.includes(as)) {
    throw new Error(`Invalid wrapper element: ${as}`);
  }

  const Component = as as ElementType;

  return <Component {...props}>{children}</Component>;
};

export { DynamicElement };
