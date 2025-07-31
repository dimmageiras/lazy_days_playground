import type { CustomHtmlTags } from "html-tags";
import htmlTags from "html-tags";
import type {
  ComponentPropsWithRef,
  ElementType,
  JSX,
  PropsWithChildren,
} from "react";

/**
 * Props type for the DynamicElement component
 * @template TWrapperElement - The HTML tag type to render
 */
type DynamicElementProps<TWrapperElement extends CustomHtmlTags> =
  PropsWithChildren<ComponentPropsWithRef<TWrapperElement>> & {
    /** The HTML tag to render */
    as: TWrapperElement;
  };

/**
 * A type-safe component for rendering dynamic HTML elements, including custom elements like iconify-icon.
 *
 * @example
 * ```tsx
 * // Render a div
 * <DynamicElement as="div" className="wrapper">
 *   Content here
 * </DynamicElement>
 *
 * // Render custom iconify-icon element
 * <DynamicElement as="iconify-icon" icon="material-symbols:star" />
 *
 * // Render a section
 * <DynamicElement as="section" role="banner">
 *   <h1>Page Header</h1>
 * </DynamicElement>
 * ```
 *
 * @template TDynamicElement - The HTML tag type to render
 * @param props - The DynamicElement component props
 * @param props.children - Child content
 * @param props.as - The HTML tag to render
 * @param props.props - All props corresponding to the specified HTML element are supported
 * @returns JSX.Element - The rendered dynamic element
 * @throws {Error} When an invalid wrapper element is provided
 */
const DynamicElement = <TDynamicElement extends CustomHtmlTags>({
  children,
  as,
  ...props
}: DynamicElementProps<TDynamicElement>): JSX.Element => {
  const customTags: CustomHtmlTags[] = (
    ["iconify-icon", ...htmlTags] as const
  ).filter((tag) => tag !== "math");

  if (!customTags.includes(as)) {
    throw new Error(`Invalid wrapper element: ${as}`);
  }

  const Component = as as ElementType;

  return <Component {...props}>{children}</Component>;
};

export { DynamicElement };
