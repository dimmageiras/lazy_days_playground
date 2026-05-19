import type { UnknownMap } from "type-fest";

import type { MapKey, MapValueAt } from "@shared/types/app/utility-types";

const getMapValue = <
  TMap extends UnknownMap,
  TKey extends MapKey<TMap> | (string & {}),
>(
  map: TMap,
  key: TKey,
): MapValueAt<TMap, TKey> => map.get(key) as MapValueAt<TMap, TKey>;

const MapHelper = Object.freeze({
  getMapValue,
} as const);

export { MapHelper };
