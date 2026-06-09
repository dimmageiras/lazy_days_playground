import type { Map as ImmutableMap, Set as ImmutableSet } from "immutable";
import type { KeyAsString, LiteralToPrimitive } from "type-fest";

type MapKey<
  TMap extends
    | ImmutableMap<unknown, unknown>
    | Map<unknown, unknown>
    | ReadonlyMap<unknown, unknown>,
> =
  TMap extends ImmutableMap<infer Key, unknown>
    ? Key
    : TMap extends ReadonlyMap<infer Key, unknown>
      ? Key
      : never;

type MapValue<
  TMap extends
    | ImmutableMap<unknown, unknown>
    | Map<unknown, unknown>
    | ReadonlyMap<unknown, unknown>,
> =
  TMap extends ImmutableMap<unknown, infer Value>
    ? Value
    : TMap extends ReadonlyMap<unknown, infer Value>
      ? Value
      : never;

type MapValueAt<
  TMap extends
    | ImmutableMap<unknown, unknown>
    | Map<unknown, unknown>
    | ReadonlyMap<unknown, unknown>,
  TKey extends MapKey<TMap> | (string & {}),
> = string extends TKey
  ? MapValue<TMap> | undefined
  : TKey extends MapKey<TMap>
    ? MapValue<TMap>
    : undefined;

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, TObject[Key]];
  }[KeyAsString<TObject>]
>;

type SetValue<
  TSet extends ImmutableSet<unknown> | Set<unknown> | ReadonlySet<unknown>,
> =
  TSet extends ImmutableSet<infer Value>
    ? Value
    : TSet extends ReadonlySet<infer Value>
      ? Value
      : never;

type SetValueInput<
  TSet extends ImmutableSet<unknown> | Set<unknown> | ReadonlySet<unknown>,
> = SetValue<TSet> | LiteralToPrimitive<SetValue<TSet>>;

export type {
  MapKey,
  MapValue,
  MapValueAt,
  ObjectEntries,
  SetValue,
  SetValueInput,
};
