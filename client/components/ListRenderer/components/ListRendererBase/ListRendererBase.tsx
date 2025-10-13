import type { ComponentProps, JSX } from "react";
import { Fragment, useState } from "react";

import type { ListRenderer } from "@client/components/ListRenderer";
import { ListItem } from "@client/components/ListRenderer/components/ListRendererBase/components/ListItem";

import { ListRendererBaseHelper } from "./helpers/list-renderer-base.helper";

/**
 * Internal base component for ListRenderer that handles the core list rendering logic.
 * Uses ListRendererBaseHelper for stable key generation and ListItem for memoized rendering
 * to ensure optimal performance.
 *
 * @template TItem - The type of items in the data array
 * @param props - The ListRendererBase component props
 * @param props.data - Array of items to render
 * @param props.getKey - Optional key extraction function (falls back to UUID for objects/arrays or stringified value)
 * @param props.renderComponent - Render function for each item
 * @returns JSX.Element[] - Array of rendered list items wrapped in Fragment with stable keys
 * @internal
 */
const ListRendererBase = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ComponentProps<typeof ListRenderer<TItem>>): JSX.Element[] => {
  const [keyMap] = useState(() => new WeakMap<WeakKey, string>());

  const { generateStableKey } = ListRendererBaseHelper;

  const renderedItems = data.map((item: TItem, index: number): JSX.Element => {
    const key = generateStableKey(item, index, keyMap, getKey);

    return (
      <Fragment key={key}>
        <ListItem data={item} index={index} renderComponent={renderComponent} />
      </Fragment>
    );
  });

  return renderedItems;
};

export { ListRendererBase };
