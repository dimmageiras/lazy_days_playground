import { Map as ImmutableMap, Set as ImmutableSet } from "immutable";

const SHARED_TEST_DATA = Object.freeze({
  EMPTY_ARRAY: [],
  EMPTY_IMMUTABLE_MAP: ImmutableMap(),
  EMPTY_IMMUTABLE_SET: ImmutableSet(),
  EMPTY_OBJECT: {},
  EMPTY_STRING: "",
} as const);

export { SHARED_TEST_DATA };
