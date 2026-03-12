import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";

const { getObjectKeys, isObject } = ObjectUtilsHelper;

const decodeFlightLikePayload = (
  table: readonly unknown[],
  slot: number = 0,
): unknown => {
  const entry = Reflect.get(table, slot);

  if (!isObject(entry)) {
    return entry;
  }

  const decoded: Record<string, unknown> = {};

  for (const key of getObjectKeys(entry)) {
    const keySlot = Number.parseInt(key.slice(1), 10);
    const valueSlot = Number(Reflect.get(entry, key));

    const name = Reflect.get(table, keySlot);

    decoded[String(name)] = decodeFlightLikePayload(table, valueSlot);
  }

  return decoded;
};

export const ReactRouterHelper = {
  decodeFlightLikePayload,
};
