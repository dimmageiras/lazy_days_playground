import type { Set as ImmutableSet } from "immutable";
import type { KeyAsString } from "type-fest";

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

export type { ObjectEntries, SetValue };
