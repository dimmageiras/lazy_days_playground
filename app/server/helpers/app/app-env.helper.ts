import { ObjectHelper } from "@shared/helpers/object.helper";
import { StringHelper } from "@shared/helpers/string.helper";
import { TypeHelper } from "@shared/helpers/type.helper";
import type { AppEnv, ViteAppEnv } from "@shared/types/app-env.type";

const { getObjectEntries } = ObjectHelper;
const { replace, toCamelCase } = StringHelper;
const { castAsType } = TypeHelper;

const buildAppEnv = (env: ViteAppEnv): AppEnv => {
  const appEnv = castAsType<AppEnv>(
    Object.freeze(
      Object.fromEntries(
        getObjectEntries(env).map(([key, value]) => {
          const camelCaseKey = toCamelCase(replace(key, "VITE_APP_", ""));

          return [camelCaseKey, value];
        }),
      ),
    ),
  );

  return appEnv;
};

const AppEnvHelper = Object.freeze({
  buildAppEnv,
} as const);

export { AppEnvHelper };
