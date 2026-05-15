import type { UnknownMap } from "type-fest";

import type { MapKey, MapValueAt } from "@shared/types/app/utility-types";

import { TypesHelper } from "./types.helper";

const { castAsType } = TypesHelper;

const getMapValue = <
  TMap extends UnknownMap,
  TKey extends MapKey<TMap> | (string & {}),
>(
  map: TMap,
  key: TKey,
): MapValueAt<TMap, TKey> => castAsType<MapValueAt<TMap, TKey>>(map.get(key));

const MapUtilsHelper = Object.freeze({
  getMapValue,
} as const);

export { MapUtilsHelper };
