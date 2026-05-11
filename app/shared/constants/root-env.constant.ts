import type { ValueOf } from "type-fest";

import { RootEnvHelper } from "@shared/helpers/root-env.helper";

const { getEnvVariables, getMode } = RootEnvHelper;

const {
  VITE_APP_ALL_DEV_TOOLS,
  VITE_APP_HOST,
  VITE_APP_IS_DEVELOPMENT,
  VITE_APP_PORT,
  VITE_APP_RQDT,
  VITE_APP_RRDT,
  VITE_APP_TYPE_GENERATOR_MODE,
} = getEnvVariables();

const CLIENT_HOST = VITE_APP_HOST;
const CLIENT_PORT = VITE_APP_PORT;

const ENV_FLAGS = Object.freeze({
  HAS_DEV_TOOLS: VITE_APP_ALL_DEV_TOOLS === "true",
  HAS_RQDT: VITE_APP_RQDT === "true",
  HAS_RRDT: VITE_APP_RRDT === "true",
  IS_DEVELOPMENT: VITE_APP_IS_DEVELOPMENT === "true",
} as const);

const MODES = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TYPE_GENERATOR: "type_generator",
} as const);

const MODE: ValueOf<typeof MODES> = getMode(
  ENV_FLAGS.IS_DEVELOPMENT,
  !!VITE_APP_TYPE_GENERATOR_MODE,
);

export { CLIENT_HOST, CLIENT_PORT, ENV_FLAGS, MODE, MODES };
