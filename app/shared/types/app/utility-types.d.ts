import type { KeyAsString } from "type-fest";

type ObjectEntries<TObject extends Record<string, unknown>> = Array<
  {
    [Key in KeyAsString<TObject>]: [Key, TObject[Key]];
  }[KeyAsString<TObject>]
>;

export type { ObjectEntries };
