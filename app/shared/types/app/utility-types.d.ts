import type { Set } from "immutable";
import type { KeyAsString } from "type-fest";

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, TObject[Key]];
  }[KeyAsString<TObject>]
>;

type SetValue<TSet extends Set<unknown>> =
  TSet extends Set<infer Value> ? Value : never;

export type { ObjectEntries, SetValue };
