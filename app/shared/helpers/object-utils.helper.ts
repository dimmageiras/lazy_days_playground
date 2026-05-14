import type { KeyAsString, UnknownRecord, ValueOf } from "type-fest";

import type { HasObjectKeyNarrow } from "@shared/types/app/utility-types";

import { ArrayUtilsHelper } from "./array-utils.helper";
import { TypesHelper } from "./types.helper";

const { isArray } = ArrayUtilsHelper;
const { castAsType } = TypesHelper;

const deleteObjectKeys = <
  TObject extends Record<string, unknown>,
  TKeys extends KeyAsString<TObject> | (string & {}),
>(
  initialObject: TObject,
  keysToDelete: ReadonlyArray<TKeys>,
): Omit<TObject, TKeys> => {
  for (const key of keysToDelete) {
    Reflect.deleteProperty(initialObject, key);
  }

  return initialObject;
};

const getObjectEntries = <TObject extends Record<string, unknown>>(
  object: TObject,
): Array<
  {
    [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
  }[KeyAsString<TObject>]
> =>
  castAsType<
    Array<
      {
        [Key in KeyAsString<TObject>]: [Key, ValueOf<TObject>];
      }[KeyAsString<TObject>]
    >
  >(Object.entries(object));

const getObjectKeys = <TObject extends Record<string, unknown>>(
  object: TObject,
): Array<KeyAsString<TObject>> =>
  castAsType<Array<KeyAsString<TObject>>>(Object.keys(object));

const getObjectValues = <TObject extends Record<string, unknown>>(
  initialObject: TObject,
): Array<ValueOf<TObject>> =>
  castAsType<Array<ValueOf<TObject>>>(Object.values(initialObject));

const isObject = (item: unknown): item is Record<string, unknown> => {
  return typeof item === "object" && item != null && !isArray(item);
};

const hasObjectKey = <TObject extends object, TKey extends string>(
  initialObject: TObject,
  key: TKey,
): initialObject is HasObjectKeyNarrow<TObject, TKey> => {
  return Reflect.has(initialObject, key);
};

const isPlainObject = (item: unknown): item is UnknownRecord => {
  if (!isObject(item)) {
    return false;
  }

  const proto = Reflect.getPrototypeOf(item);

  return proto === null || proto === Object.prototype;
};

const ObjectUtilsHelper = Object.freeze({
  deleteObjectKeys,
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isObject,
  isPlainObject,
} as const);

export { ObjectUtilsHelper };
