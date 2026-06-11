import type {
  AnyMap,
  MapKey,
  MapValueAt,
} from "@shared/types/app/utility-types";

import { TypesHelper } from "./types.helper";

const { castAsType } = TypesHelper;

const getMapValue = <
  TMap extends AnyMap,
  TKey extends MapKey<TMap> | (string & {}),
  TFallback = undefined,
>(
  map: TMap,
  key: TKey,
  fallback?: TFallback,
): TFallback extends undefined
  ? MapValueAt<TMap, TKey>
  : Exclude<MapValueAt<TMap, TKey>, undefined> | TFallback =>
  castAsType<
    TFallback extends undefined
      ? MapValueAt<TMap, TKey>
      : Exclude<MapValueAt<TMap, TKey>, undefined> | TFallback
  >(map.has(key) ? map.get(key) : fallback);

const MapHelper = Object.freeze({
  getMapValue,
} as const);

export { MapHelper };
