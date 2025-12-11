import type { ComponentProps, JSX } from "react";
import { Fragment, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import type { ListRenderer } from "@client/components/ListRenderer";
import { ListItem } from "@client/components/ListRenderer/components/ListRendererBase/components/ListItem";
import { ArrayUtilitiesHelper } from "@client/helpers/array-utilities.helper";
import { ObjectUtilitiesHelper } from "@client/helpers/object-utilities.helper";
import { IS_DEVELOPMENT } from "@shared/constants/root-env.constants";

const ListRendererBase = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ComponentProps<typeof ListRenderer<TItem>>): JSX.Element[] => {
  const [keyMap] = useState(() => new WeakMap<WeakKey, string>());

  const generateStableKey = (
    item: TItem,
    index: number,
    keyMap: WeakMap<WeakKey, string>,
    getKey?: ((item: TItem, index: number) => number | string) | undefined
  ): string => {
    if (getKey) {
      return String(getKey(item, index));
    }

    if (IS_DEVELOPMENT) {
      console.warn(
        "Performance warning: No getKey function provided. Generating UUID or stringified item as key for item:",
        item,
        "Consider providing a getKey function for better performance."
      );
    }

    const { isArray } = ArrayUtilitiesHelper;
    const { isPlainObject } = ObjectUtilitiesHelper;

    if (isArray(item) || isPlainObject(item)) {
      if (!keyMap.has(item)) {
        keyMap.set(item, uuidv4());
      }

      const key = keyMap.get(item);

      if (key) {
        return key;
      }
    }

    const stringifiedItem = `${index}-${item}`;

    return stringifiedItem;
  };

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
