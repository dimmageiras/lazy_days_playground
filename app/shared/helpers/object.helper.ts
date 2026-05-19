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

const isObject = (item: unknown): item is Record<string, unknown> => {
  return typeof item === "object" && item != null && !isArray(item);
};

const isObjectKey = <TObject extends object>(
  object: TObject,
  key: PropertyKey,
): key is keyof TObject => Object.hasOwn(object, key);

const isPlainObject = (item: unknown): item is UnknownRecord => {
  if (!isObject(item)) {
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
): void => {
  for (const key of keysToStrip) {
    Reflect.deleteProperty(object, key);
  }
};

const ObjectHelper = Object.freeze({
  getObjectEntries,
  getObjectKeys,
  getObjectValues,
  isObject,
  isObjectKey,
  isPlainObject,
  stripKeysInPlace,
} as const);

export { ObjectHelper };
