import type { JSX } from "react";
import { memo } from "react";

interface ListItemProps<TItem> {
  data: TItem;
  index: number;
  renderComponent: (props: { data: TItem; index: number }) => JSX.Element;
}

const ListItem: <TItem>(props: ListItemProps<TItem>) => JSX.Element = <TItem>({
  data,
  index,
  renderComponent,
}: ListItemProps<TItem>) => {
  return renderComponent({ data, index });
};

const MemoizedListItem = memo(ListItem) as <TItem>(
  props: ListItemProps<TItem>
) => JSX.Element;

export { MemoizedListItem as ListItem };
