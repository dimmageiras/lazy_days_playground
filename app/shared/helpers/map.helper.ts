import type {
  AnyMap,
  MapKey,
  MapValue,
  MapValueAt,
} from "@shared/types/app/utility-types";

import { TypeHelper } from "./type.helper";

const { castAsType } = TypeHelper;

const getMapValue = <
  TMap extends AnyMap,
  TKey extends MapKey<TMap> | (number & {}) | (string & {}),
  TFallback = undefined,
>(
  map: TMap,
  key: TKey,
  fallback?: TFallback,
): TFallback extends undefined
  ? MapValueAt<TMap, TKey>
  : MapValue<TMap> | TFallback =>
  castAsType<
    TFallback extends undefined
      ? MapValueAt<TMap, TKey>
      : MapValue<TMap> | TFallback
  >(map.has(key) ? map.get(key) : fallback);

const MapHelper = Object.freeze({
  getMapValue,
} as const);

export { MapHelper };
