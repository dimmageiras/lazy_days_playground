import type { KeyAsString, UnknownMap, UnknownSet, ValueOf } from "type-fest";

type MapKey<TMap extends UnknownMap> =
  TMap extends ReadonlyMap<infer Key, unknown> ? Key : never;

type MapValueAt<TMap extends UnknownMap, TKey> =
  TMap extends ReadonlyMap<infer Key, infer Value>
    ? string extends TKey
      ? Value | undefined
      : TKey extends Key
        ? Value
        : undefined
    : never;

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
  }[KeyAsString<TObject>]
>;

type SetValue<TSet extends UnknownSet> =
  TSet extends ReadonlySet<infer Value> ? Value : never;

export type { MapKey, MapValueAt, ObjectEntries, SetValue };
