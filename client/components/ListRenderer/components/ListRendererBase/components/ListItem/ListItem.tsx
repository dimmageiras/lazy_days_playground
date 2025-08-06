import type { ComponentProps, JSX } from "react";
import { memo } from "react";

import type { ListRenderer } from "@client/components/ListRenderer";

type ListRenderer<TItem> = ComponentProps<typeof ListRenderer<TItem>>;

interface ListItemProps<TItem> {
  data: ListRenderer<TItem>["data"][number];
  index: number;
  renderComponent: ListRenderer<TItem>["renderComponent"];
}

const ListItem = <TItem,>({
  data,
  index,
  renderComponent,
}: ListItemProps<TItem>) => {
  return <>{renderComponent({ data, index })}</>;
};

const MemoizedListItem = memo(ListItem) as <TItem>(
  props: ListItemProps<TItem>
) => JSX.Element;

export { MemoizedListItem as ListItem };
