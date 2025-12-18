import type { ValueOf } from "type-fest";

import { MODES } from "../constants/root-env.constant.ts";

const getMode = (
  isDevelopment: boolean,
  isTypeGeneratorMode: boolean
): ValueOf<typeof MODES> => {
  switch (true) {
    case isTypeGeneratorMode:
      return MODES.TYPE_GENERATOR;

    case isDevelopment:
      return MODES.DEVELOPMENT;

    default:
      return MODES.PRODUCTION;
  }
};

export const RootEnvHelper = { getMode };
