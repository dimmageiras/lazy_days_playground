import type { ComponentProps, JSX } from "react";
import { Fragment, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import type { ListRenderer } from "@Client/components/ListRenderer";
import { ListItem } from "@Client/components/ListRenderer/components/ListRendererBase/components/ListItem";
import { IS_DEVELOPMENT } from "@Client/constants/env.constants";
import { ArrayUtilitiesHelper } from "@Client/helpers/array-utilities.helper";
import { ObjectUtilitiesHelper } from "@Client/helpers/object-utilities.helper";

const ListRendererBase = <TItem,>({
  data,
  getKey,
  renderComponent,
}: ComponentProps<typeof ListRenderer<TItem>>): JSX.Element[] => {
  const keyMap = useRef(new WeakMap<WeakKey, string>());

  const generateStableKey = (item: TItem, index: number): string => {
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
    const { isObject } = ObjectUtilitiesHelper;

    const stringifiedItem = `${index}-${item}`;

    if (isArray(item) || isObject(item)) {
      if (!keyMap.current.has(item)) {
        keyMap.current.set(item, uuidv4());
      }

      const key = keyMap.current.get(item);

      if (key) {
        return key;
      }
    }

    return stringifiedItem;
  };

  const renderedItems = data.map((item: TItem, index: number): JSX.Element => {
    const key = generateStableKey(item, index);

    return (
      <Fragment key={key}>
        <ListItem data={item} index={index} renderComponent={renderComponent} />
      </Fragment>
    );
  });

  return renderedItems;
};

export { ListRendererBase };
