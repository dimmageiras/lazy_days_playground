import type { Map as ImmutableMap, Set as ImmutableSet } from "immutable";
import type { KeyAsString, LiteralToPrimitive } from "type-fest";

type AnyMap =
  | ImmutableMap<unknown, unknown>
  | Map<unknown, unknown>
  | ReadonlyMap<unknown, unknown>;

type AnySet = ImmutableSet<unknown> | Set<unknown> | ReadonlySet<unknown>;

type MapKey<TMap extends AnyMap> =
  TMap extends ImmutableMap<infer Key, unknown>
    ? Key
    : TMap extends ReadonlyMap<infer Key, unknown>
      ? Key
      : never;

type MapValue<TMap extends AnyMap> =
  TMap extends ImmutableMap<unknown, infer Value>
    ? Value
    : TMap extends ReadonlyMap<unknown, infer Value>
      ? Value
      : never;

type MapValueAt<
  TMap extends AnyMap,
  TKey extends MapKey<TMap> | (string & {}) | (number & {}),
> = [MapKey<TMap>] extends [TKey]
  ? MapValue<TMap> | undefined
  : TKey extends MapKey<TMap>
    ? MapValue<TMap>
    : undefined;

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, TObject[Key]];
  }[KeyAsString<TObject>]
>;

type SetValue<TSet extends AnySet> =
  TSet extends ImmutableSet<infer Value>
    ? Value
    : TSet extends ReadonlySet<infer Value>
      ? Value
      : never;

type SetValueInput<TSet extends AnySet> =
  SetValue<TSet> | LiteralToPrimitive<SetValue<TSet>>;

export type {
  AnyMap,
  AnySet,
  MapKey,
  MapValue,
  MapValueAt,
  ObjectEntries,
  SetValue,
  SetValueInput,
};
