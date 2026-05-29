const { VITE_APP_PORT, VITE_APP_SERVICE_NAME } = import.meta.env;

const APP_ENV = Object.freeze({
  APP_PORT: VITE_APP_PORT,
  APP_SERVICE_NAME: VITE_APP_SERVICE_NAME,
} as const);

export { APP_ENV };
