const {
  VITE_APP_HOST,
  VITE_APP_LOG_LEVEL,
  VITE_APP_IS_DEVELOPMENT,
  VITE_APP_PORT,
} = typeof process !== "undefined" ? process.env : import.meta.env;

const IS_DEVELOPMENT = VITE_APP_IS_DEVELOPMENT === "true";

const MODES = {
  DEVELOPMENT: "development",
  PRODUCTION: "production",
} as const;

const MODE = IS_DEVELOPMENT ? MODES.DEVELOPMENT : MODES.PRODUCTION;

export {
  IS_DEVELOPMENT,
  MODE,
  MODES,
  VITE_APP_HOST as HOST,
  VITE_APP_LOG_LEVEL as LOG_LEVEL,
  VITE_APP_PORT as PORT,
};
