import { Map as ImmutableMap, Set as ImmutableSet } from "immutable";
import replace from "lodash-es/replace";

import { ObjectHelper } from "@shared/helpers/object.helper";
import { StringHelper } from "@shared/helpers/string.helper";
import { TypeHelper } from "@shared/helpers/type.helper";
import { appEnvSchema } from "@shared/schemas/app-env.schema";
import type { AppEnv } from "@shared/types/app-env.type";

const { getObjectEntries } = ObjectHelper;
const { toCamelCase } = StringHelper;
const { castAsType } = TypeHelper;

const BOOLEAN_FALSE = false as const;
const BOOLEAN_TRUE = true as const;

const COMMON_BIND_ALL_IPV4 = "0.0.0.0" as const;
const COMMON_LOG_LEVEL = "info" as const;
const COMMON_STRING = "hello" as const;

const NUMBER_1 = 1 as const;
const NUMBER_2 = 2 as const;
const NUMBER_3 = 3 as const;

const STRING_A = "a" as const;
const STRING_B = "b" as const;
const STRING_C = "c" as const;
const STRING_FALSE = `${BOOLEAN_FALSE}` as const;
const STRING_TRUE = `${BOOLEAN_TRUE}` as const;

const VALID_BASE64_TOKEN =
  "ThisIsAFakeTokenghijklmnop1234567890abcdefghijklmnop1234567890abcdefghijklmnop1234567890" as const;
const VALID_PORT = 3000 as const;
const VALID_RAW_DEV_ENV = castAsType<ImportMetaEnv>({
  VITE_APP_BIND_ALL_IPV4: COMMON_BIND_ALL_IPV4,
  VITE_APP_IS_DEVELOPMENT: STRING_TRUE,
  VITE_APP_LOG_LEVEL: COMMON_LOG_LEVEL,
  VITE_APP_PORT: `${VALID_PORT}`,
  VITE_APP_SERVICE_NAME: COMMON_STRING,
  VITE_APP_SHUTDOWN_TOKEN: VALID_BASE64_TOKEN,
});
const VALID_VITE_APP_ENV = appEnvSchema.parse(VALID_RAW_DEV_ENV);

const SHARED_TEST_DATA = Object.freeze({
  BOOLEAN_FALSE,
  BOOLEAN_TRUE,
  COMMON_BIND_ALL_IPV4,
  COMMON_DATE: "2025-01-01",
  COMMON_LOG_LEVEL,
  COMMON_NUMBER: 42,
  COMMON_NUMBER_ARRAY: [NUMBER_1, NUMBER_2, NUMBER_3],
  COMMON_NUMBER_PAIRS_ARRAY: [[NUMBER_1, NUMBER_1]],
  COMMON_ONE_STRING_ARRAY: [STRING_A],
  COMMON_STRING,
  COMMON_STRING_ARRAY: [STRING_A, STRING_B, STRING_C],
  COMMON_STRING_NUMBER_PAIRS_ARRAY: [[STRING_A, NUMBER_1]],
  COMMON_TWO_STRING_ARRAY: [STRING_A, STRING_B],
  EMPTY_ARRAY: [],
  EMPTY_IMMUTABLE_MAP: ImmutableMap(),
  EMPTY_IMMUTABLE_SET: ImmutableSet(),
  EMPTY_OBJECT: {},
  EMPTY_STRING: "",
  MAX_PORT: 65535,
  MIN_PORT: 1,
  NAN_VALUE: Number.NaN,
  NULL_VALUE: null,
  NUMBER_1,
  STRING_A,
  STRING_B,
  STRING_FALSE,
  STRING_TRUE,
  UNDEFINED_VALUE: undefined,
  VALID_BASE64_TOKEN,
  VALID_DEV_APP_ENV: getObjectEntries(VALID_VITE_APP_ENV).reduce<AppEnv>(
    (appEnv, [key, value]) => {
      const camelCaseKey = toCamelCase(replace(key, /^VITE_APP_/, ""));

      return {
        ...appEnv,
        [camelCaseKey]: value,
      };
    },
    castAsType<AppEnv>({}),
  ),
  VALID_PORT,
  VALID_RAW_DEV_ENV,
  VALID_VITE_APP_ENV,
  get toUnknown() {
    return (value: unknown): unknown => castAsType<unknown>(value);
  },
} as const);

export { SHARED_TEST_DATA };
