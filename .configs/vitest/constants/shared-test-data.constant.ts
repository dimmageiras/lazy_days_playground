import { Map as ImmutableMap, Set as ImmutableSet } from "immutable";

import { TypesHelper } from "@shared/helpers/types.helper";

const { castAsType } = TypesHelper;

const NUMBER_1 = 1;
const NUMBER_2 = 2;
const NUMBER_3 = 3;

const STRING_A = "a";
const STRING_B = "b";
const STRING_C = "c";

const SHARED_TEST_DATA = Object.freeze({
  BOOLEAN_FALSE: false,
  BOOLEAN_TRUE: true,
  COMMON_NUMBER_ARRAY: [NUMBER_1, NUMBER_2, NUMBER_3],
  COMMON_NUMBER_PAIRS_ARRAY: [[NUMBER_1, NUMBER_1]],
  COMMON_NUMBER: 42,
  COMMON_ONE_STRING_ARRAY: [STRING_A],
  COMMON_STRING_ARRAY: [STRING_A, STRING_B, STRING_C],
  COMMON_STRING_NUMBER_PAIRS_ARRAY: [[STRING_A, NUMBER_1]],
  COMMON_STRING: "hello",
  COMMON_TWO_STRING_ARRAY: [STRING_A, STRING_B],
  EMPTY_ARRAY: [],
  EMPTY_IMMUTABLE_MAP: ImmutableMap(),
  EMPTY_IMMUTABLE_SET: ImmutableSet(),
  EMPTY_OBJECT: {},
  EMPTY_STRING: "",
  NAN_VALUE: Number.NaN,
  NULL_VALUE: null,
  NUMBER_1,
  NUMBER_2,
  NUMBER_3,
  STRING_A,
  STRING_B,
  STRING_C,
  UNDEFINED_VALUE: undefined,
  get castAsUnknown() {
    return (value: unknown): unknown => castAsType<unknown>(value);
  },
} as const);

export { SHARED_TEST_DATA };
