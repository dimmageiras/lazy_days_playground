
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
import { reactRouter } from "@react-router/dev/vite";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig } from "vite";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

const __unconfig_default =  defineConfig(({ mode }) => {
  const IS_DEVELOPMENT = mode === "development";
  const HAS_DEV_TOOLS = process.env.VITE_APP_ALL_DEV_TOOLS === "true";
  const HAS_RRDT = process.env.VITE_APP_RRDT === "true";

  return {
    plugins: [
      HAS_DEV_TOOLS && HAS_RRDT && reactRouterDevTools(),
      reactRouter(),
      tsConfigPaths(),
      IS_DEVELOPMENT &&
        pluginChecker({
          eslint: {
            dev: {
              logLevel: ["error"],
            },
            lintCommand: `eslint . \
    --report-unused-disable-directives \
    --max-warnings 0 \
    --rule "no-console: ['error', { allow: ['error', 'info', 'warn'] }]" \
    --rule "react-hooks/exhaustive-deps: off"`,
            useFlatConfig: true,
          },
          // TODO: Enable overlay when an update that fixes the issue is released
          overlay: false,
          typescript: true,
        }),
    ],
  };
}) satisfies UserConfigFnObject;

if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;