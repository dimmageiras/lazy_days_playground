import type { FlightLikePayload } from "react-router";

import { ArrayUtilsHelper } from "@shared/helpers/array-utils.helper";
import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const { isArray } = ArrayUtilsHelper;
const { getObjectKeys, isObject } = ObjectUtilsHelper;

const decodeTable = (
  table: FlightLikePayload,
  slot: number,
  visited: Set<number>,
): unknown => {
  if (visited.has(slot)) {
    return undefined;
  }

  const entry = Reflect.get(table, slot);

  if (isArray(entry)) {
    visited.add(slot);

    return entry.map((element) => {
      if (typeof element === "number" && element >= 0) {
        return decodeTable(table, element, visited);
      }

      return element;
    });
  }

  if (!isObject(entry)) {
    return entry;
  }

  visited.add(slot);

  return Object.fromEntries(
    getObjectKeys(entry).map((key) => {
      const keySlot = Number.parseInt(key.slice(1), 10);
      const valueSlot = Number(Reflect.get(entry, key));
      const name = Reflect.get(table, keySlot);

      return [String(name), decodeTable(table, valueSlot, visited)];
    }),
  );
};

const decodeFlightLikePayload = (
  table: FlightLikePayload,
  slot: number = 0,
): Record<string, unknown> | null => {
  if (!isArray(table)) {
    throw new Error("Table is not an array");
  }

  const decodedTable = decodeTable(table, slot, new Set<number>());

  if (isObject(decodedTable)) {
    return decodedTable;
  }

  return null;
};

export const ReactRouterHelper = {
  decodeFlightLikePayload,
};
