import type { ComponentProps, JSX } from "react";

import type { ListRenderer } from "@client/components/ListRenderer";

/**
 * Type alias for ListRenderer component props to avoid circular type references
 */
type ListRenderer<TItem> = ComponentProps<typeof ListRenderer<TItem>>;

/**
 * Props interface for the ListItem component
 * @template TItem - The type of the item to render
 */
interface ListItemProps<TItem> {
  /** The data item to render */
  data: ListRenderer<TItem>["data"][number];
  /** The index of the item in the list */
  index: number;
  /** The render function to use for this item */
  renderComponent: ListRenderer<TItem>["renderComponent"];
}

/**
 * Internal component for rendering individual list items in ListRendererBase.
 *
 * @template TItem - The type of the item to render
 * @param props - The ListItem component props
 * @param props.data - The data item to render
 * @param props.index - The index of the item in the list
 * @param props.renderComponent - The render function to use for this item
 * @returns JSX.Element - The rendered list item
 * @internal
 */
const ListItem = <TItem,>({
  data,
  index,
  renderComponent,
}: ListItemProps<TItem>): JSX.Element => {
  return <>{renderComponent({ data, index })}</>;
};

export { ListItem };
