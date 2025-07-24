import type { CustomHtmlTags } from "html-tags";
import htmlTags from "html-tags";
import type { ElementType, JSX, PropsWithChildren } from "react";

type DynamicElementProps<TWrapperElement extends CustomHtmlTags> =
  PropsWithChildren<JSX.IntrinsicElements[TWrapperElement]> & {
    as: TWrapperElement;
  };

const DynamicElement = <TDynamicElement extends CustomHtmlTags>({
  children,
  as,
  ...props
}: DynamicElementProps<TDynamicElement>): JSX.Element => {
  const validTags = (["iconify-icon", ...htmlTags] as const).filter(
    (tag) => tag !== "math"
  );

  if (!validTags.includes(as)) {
    throw new Error(`Invalid wrapper element: ${as}`);
  }

  const DynamicElement = as as ElementType;

  return <DynamicElement {...props}>{children}</DynamicElement>;
};

export { DynamicElement };
