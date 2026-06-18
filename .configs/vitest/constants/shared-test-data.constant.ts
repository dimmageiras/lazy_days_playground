const EMPTY_ARRAY = [] as const;
const EMPTY_OBJECT = {} as const;
const EMPTY_STRING = "" as const;

const SHARED_TEST_DATA = Object.freeze({
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  EMPTY_STRING,
} as const);

export { SHARED_TEST_DATA };
