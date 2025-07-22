import type { CustomHtmlTags } from "html-tags";
import htmlTags from "html-tags";
import type { ElementType, JSX, PropsWithChildren } from "react";

type WrapperElementProps<TWrapperElement extends CustomHtmlTags> =
  PropsWithChildren<JSX.IntrinsicElements[TWrapperElement]> & {
    as: TWrapperElement;
  };

const WrapperElement = <TWrapperElement extends CustomHtmlTags>({
  children,
  as,
  ...props
}: WrapperElementProps<TWrapperElement>): JSX.Element => {
  const validTags = (["iconify-icon", ...htmlTags] as const).filter(
    (tag) => tag !== "math"
  );

  if (!validTags.includes(as)) {
    throw new Error(`Invalid wrapper element: ${as}`);
  }

  const Wrapper = as as ElementType;

  return <Wrapper {...props}>{children}</Wrapper>;
};

export { WrapperElement };
