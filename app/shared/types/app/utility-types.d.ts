import type { UnknownMap } from "type-fest";

type HasObjectKeyNarrow<TObject extends object, TKey extends string> =
  Extract<TObject, Record<TKey, unknown>> extends never
    ? TObject & Record<TKey, unknown>
    : Extract<TObject, Record<TKey, unknown>>;

type MapKey<TMap extends UnknownMap> =
  TMap extends ReadonlyMap<infer Key, unknown> ? Key : never;

type MapValue<TMap extends UnknownMap> =
  TMap extends ReadonlyMap<unknown, infer Value> ? Value : never;

type MapValueAt<TMap extends UnknownMap, TKey> =
  TMap extends ReadonlyMap<infer Key, infer Value>
    ? string extends TKey
      ? Value | undefined
      : TKey extends Key
        ? Value
        : undefined
    : never;

export type { HasObjectKeyNarrow, MapKey, MapValue, MapValueAt };
