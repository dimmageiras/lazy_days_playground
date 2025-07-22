import type { ElementType, JSX, PropsWithChildren } from "react";
import { useRouteLoaderData } from "react-router";

import type { WrapperTagElement } from "~/types/html-tags.type";

type WrapperElementProps<TWrapperElement extends WrapperTagElement> =
  PropsWithChildren<JSX.IntrinsicElements[TWrapperElement]> & {
    as: TWrapperElement;
  };

const WrapperElement = <TWrapperElement extends WrapperTagElement>({
  children,
  as,
  ...props
}: WrapperElementProps<TWrapperElement>): JSX.Element => {
  const appLayoutLoaderData = useRouteLoaderData<{
    htmlTags: WrapperTagElement[];
  } | null>("root");
  const validTags = appLayoutLoaderData?.htmlTags || [];

  if (!validTags.length || (validTags.length && !validTags.includes(as))) {
    throw new Error(`Invalid wrapper element: ${as}`);
  }

  const Wrapper = as as ElementType;

  return <Wrapper {...props}>{children}</Wrapper>;
};

export { WrapperElement };
