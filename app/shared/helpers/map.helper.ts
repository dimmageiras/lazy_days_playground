import type { Map as ImmutableMap } from "immutable";

import type { MapKey, MapValueAt } from "@shared/types/app/utility-types";

import { TypesHelper } from "./types.helper";

const { castAsType } = TypesHelper;

const getMapValue = <
  TMap extends
    | ImmutableMap<unknown, unknown>
    | Map<unknown, unknown>
    | ReadonlyMap<unknown, unknown>,
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
