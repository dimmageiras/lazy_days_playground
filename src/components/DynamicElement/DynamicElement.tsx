import type { CustomHtmlTags } from "html-tags";
import htmlTags from "html-tags";
import type {
  ComponentPropsWithRef,
  ElementType,
  JSX,
  PropsWithChildren,
} from "react";

type DynamicElementProps<TWrapperElement extends CustomHtmlTags> =
  PropsWithChildren<ComponentPropsWithRef<TWrapperElement>> & {
    as: TWrapperElement;
  };

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
