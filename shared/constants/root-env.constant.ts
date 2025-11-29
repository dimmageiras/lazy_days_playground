const {
  AUTH_TAG_LENGTH,
  COOKIE_SECRET,
  GEL_AUTH_BASE_URL,
  GEL_DSN,
  IV_LENGTH,
  KEY_LENGTH,
  LOG_LEVEL,
  SALT_LENGTH,
  SSR = true,
  TOKEN_ENCRYPTION_METHOD,
  VITE_APP_ALL_DEV_TOOLS,
  VITE_APP_HOST,
  VITE_APP_IS_DEVELOPMENT,
  VITE_APP_PORT,
  VITE_APP_RQDT,
  VITE_APP_RRDT,
  VITE_APP_TYPE_GENERATOR_MODE,
} = typeof process === "object" ? process.env : import.meta.env;

const HAS_DEV_TOOLS = VITE_APP_ALL_DEV_TOOLS === "true";
const HAS_RQDT = VITE_APP_RQDT === "true";
const HAS_RRDT = VITE_APP_RRDT === "true";
const IS_DEVELOPMENT = VITE_APP_IS_DEVELOPMENT === "true";
const IS_SSR = SSR;

const MODES = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TYPE_GENERATOR: "type_generator",
} as const);

let MODE: (typeof MODES)[keyof typeof MODES];

switch (true) {
  case !!VITE_APP_TYPE_GENERATOR_MODE:
    MODE = MODES.TYPE_GENERATOR;
    break;

  case IS_DEVELOPMENT:
    MODE = MODES.DEVELOPMENT;
    break;

  default:
    MODE = MODES.PRODUCTION;
    break;
}

export {
  AUTH_TAG_LENGTH,
  COOKIE_SECRET,
  GEL_AUTH_BASE_URL,
  GEL_DSN,
  HAS_DEV_TOOLS,
  HAS_RQDT,
  HAS_RRDT,
  IS_DEVELOPMENT,
  IS_SSR,
  IV_LENGTH,
  KEY_LENGTH,
  LOG_LEVEL,
  MODE,
  MODES,
  SALT_LENGTH,
  TOKEN_ENCRYPTION_METHOD,
  VITE_APP_HOST as HOST,
  VITE_APP_PORT as PORT,
};
