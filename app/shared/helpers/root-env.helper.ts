import type { ValueOf } from "type-fest";

import type { EnvironmentVariables } from "@shared/types/app/root-env";

import { MODES } from "../constants/root-env.constant.ts";
import { ObjectUtilsHelper } from "./object-utils.helper.ts";

const getEnvVariables = (): EnvironmentVariables => {
  if (typeof process === "object") {
    return process.env;
  }

  const { isObject } = ObjectUtilsHelper;

  if (isObject(import.meta.env)) {
    return import.meta.env;
  }

  throw new Error("Environment variables are not available");
};

const getMode = (
  isDevelopment: boolean,
  isTypeGeneratorMode: boolean,
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

export const RootEnvHelper = { getEnvVariables, getMode };
