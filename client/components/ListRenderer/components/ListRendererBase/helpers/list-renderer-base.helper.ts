import type { RefObject } from "react";
import { v4 as uuidv4 } from "uuid";

import { ArrayUtilsHelper } from "@client/helpers/array-utils.helper";
import { ObjectUtilsHelper } from "@client/helpers/object-utils.helper";
import { IS_DEVELOPMENT } from "@shared/constants/root-env.constant";

/**
 * Generates a stable key for list items to optimize React's reconciliation process.
 * The key generation strategy follows this order:
 * 1. Uses provided getKey function if available
 * 2. For objects/arrays:
 *    - Uses UUID stored in WeakMap to maintain key stability across renders
 *    - Generates new UUID if item not found in WeakMap
 * 3. For primitives:
 *    - Creates a composite key using index and stringified value
 *
 * @template TItem - The type of the item to generate a key for
 * @param item - The list item
 * @param index - The item's index in the list
 * @param keyMap - React ref containing WeakMap for stable key storage
 * @param getKey - Optional function to extract key from item
 * @returns string - A stable key for the item
 * @internal
 */
const generateStableKey = <TItem>(
  item: TItem,
  index: number,
  keyMap: RefObject<WeakMap<WeakKey, string>>,
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

  const { isArray } = ArrayUtilsHelper;
  const { isPlainObject } = ObjectUtilsHelper;

  if (isArray(item) || isPlainObject(item)) {
    if (!keyMap.current.has(item)) {
      keyMap.current.set(item, uuidv4());
    }

    const key = keyMap.current.get(item);

    if (key) {
      return key;
    }
  }

  const stringifiedItem = `${index}-${item}`;

  return stringifiedItem;
};

export const ListRendererBaseHelper = {
  generateStableKey,
};
