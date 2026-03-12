import { ObjectUtilsHelper } from "@shared/helpers/object-utils.helper";
import { TypeHelper } from "@shared/helpers/type.helper";

const { getObjectKeys, isObject } = ObjectUtilsHelper;
const { castAsType } = TypeHelper;

const decodeFlightLikePayload = (
  table: readonly (Record<string, unknown> | string)[],
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

const decodeAuthActionResponse = <TOutput>(
  data: (Record<string, unknown> | string)[],
): TOutput => {
  return castAsType<TOutput>(decodeFlightLikePayload(data));
};

export { decodeAuthActionResponse };
