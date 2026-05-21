import type { KeyAsString, ValueOf } from "type-fest";

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
  }[KeyAsString<TObject>]
>;

export type { ObjectEntries };
