const {
  VITE_APP_ALL_DEV_TOOLS,
  VITE_APP_HOST,
  VITE_APP_IS_DEVELOPMENT,
  VITE_APP_LOG_LEVEL,
  VITE_APP_PORT,
  VITE_APP_RQDT,
  VITE_APP_RRDT,
} = typeof process !== "undefined" ? process.env : import.meta.env;

const IS_DEVELOPMENT = VITE_APP_IS_DEVELOPMENT === "true";
const HAS_DEV_TOOLS = VITE_APP_ALL_DEV_TOOLS === "true";
const HAS_RQDT = VITE_APP_RQDT === "true";
const HAS_RRDT = VITE_APP_RRDT === "true";

const MODES = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

const MODE = IS_DEVELOPMENT ? MODES.DEVELOPMENT : MODES.PRODUCTION;

export {
  HAS_DEV_TOOLS,
  HAS_RQDT,
  HAS_RRDT,
  IS_DEVELOPMENT,
  MODE,
  MODES,
  VITE_APP_HOST as HOST,
  VITE_APP_LOG_LEVEL as LOG_LEVEL,
  VITE_APP_PORT as PORT,
};
