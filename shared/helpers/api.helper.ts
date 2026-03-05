import type { Method } from "axios";

import { API_MUTATING_METHODS } from "../constants/api.constant.ts";
import { SetUtilsHelper } from "./set-utils.helper.ts";

const { hasSetValue } = SetUtilsHelper;

const isMutatingMethod = (method: Uppercase<Method>): boolean =>
  hasSetValue(API_MUTATING_METHODS, method);

export const ApiHelper = {
  isMutatingMethod,
};
