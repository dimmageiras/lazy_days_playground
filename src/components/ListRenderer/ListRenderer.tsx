import type { JSX } from "react";
import { Fragment } from "react";
import { v4 as uuidv4 } from "uuid";

interface ListRendererProps<TItem> {
  data: TItem[] | readonly TItem[];
  getKey?: (item: TItem) => number | string;
  renderComponent: (props: { data: TItem; index: number }) => JSX.Element;
}

const ListRenderer = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ListRendererProps<TItem>): JSX.Element[] => {
  if (!Array.isArray(data)) {
    console.error("ListRenderer: data prop must be an array");

    return [];
  }

  return data.map((item: TItem, index: number): JSX.Element => {
    const key = getKey?.(item) ?? uuidv4();

    return (
      <Fragment key={key}>{renderComponent({ data: item, index })}</Fragment>
    );
  });
};

export { ListRenderer };
