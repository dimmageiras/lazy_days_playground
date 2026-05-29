import type { KeyAsString, UnknownRecord, ValueOf } from "type-fest";

import type { ObjectEntries } from "@shared/types/app/utility-types";

import { ArrayHelper } from "./array.helper";
import { TypesHelper } from "./types.helper";

const { isArray } = ArrayHelper;
const { castAsType } = TypesHelper;

const getObjectEntries = <TObject extends Record<string, unknown>>(
  object: TObject,
): ObjectEntries<TObject> =>
  castAsType<ObjectEntries<TObject>>(Object.entries(object));

const getObjectKeys = <TObject extends Record<string, unknown>>(
  object: TObject,
): Array<KeyAsString<TObject>> =>
  castAsType<Array<KeyAsString<TObject>>>(Object.keys(object));

const getObjectValues = <TObject extends Record<string, unknown>>(
  object: TObject,
): Array<ValueOf<TObject>> =>
  castAsType<Array<ValueOf<TObject>>>(Object.values(object));

/** Narrows the object to include `key`. Use when runtime carries keys the static type omits. */
const hasObjectKey = <TObject extends object, TKey extends PropertyKey>(
  object: TObject,
  key: TKey,
): object is TObject & Record<TKey, unknown> => Object.hasOwn(object, key);

/** Narrows `key` to `keyof TObject`. Use when iterating an untyped string against a typed object. */
const isObjectKey = <TObject extends object>(
  object: TObject,
  key: PropertyKey,
): key is keyof TObject => Object.hasOwn(object, key);

const isObjectLike = (item: unknown): item is Record<string, unknown> => {
  return typeof item === "object" && item != null && !isArray(item);
};

const isPlainObject = (item: unknown): item is UnknownRecord => {
  if (!isObjectLike(item)) {
    return false;
  }

  const proto = Reflect.getPrototypeOf(item);

  return proto === null || proto === Object.prototype;
};

const stripKeysInPlace = <
  TObject extends Record<string, unknown>,
  TKeys extends KeyAsString<TObject> | (string & {}),
>(
  object: TObject,
  keysToStrip: ReadonlyArray<TKeys>,
): Omit<TObject, TKeys> => {
  for (const key of keysToStrip) {
    Reflect.deleteProperty(object, key);
  }

  return object;
};

const ObjectHelper = Object.freeze({
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  hasObjectKey,
  isObjectKey,
  isPlainObject,
  stripKeysInPlace,
} as const);

export { ObjectHelper };
