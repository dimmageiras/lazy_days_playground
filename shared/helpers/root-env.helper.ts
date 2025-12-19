import type { ValueOf } from "type-fest";

import { MODES } from "../constants/root-env.constant.ts";

const getMode = (
  isDevelopment: boolean,
  isTypeGeneratorMode: boolean
): ValueOf<typeof MODES> => {
  const { DEVELOPMENT, PRODUCTION, TYPE_GENERATOR } = MODES;

  switch (true) {
    case isTypeGeneratorMode:
      return TYPE_GENERATOR;

    case isDevelopment:
      return DEVELOPMENT;

    default:
      return PRODUCTION;
  }
};

export const RootEnvHelper = { getMode };
