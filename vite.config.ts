import { reactRouter } from "@react-router/dev/vite";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig, loadEnv } from "vite";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hasReactRouterDevTools = env.VITE_HAS_REACT_ROUTER_DEV_TOOLS === "true";

  return {
    plugins: [
      hasReactRouterDevTools && reactRouterDevTools(),
      reactRouter(),
      tsConfigPaths(),
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
        overlay: {
          initialIsOpen: false,
        },
        typescript: true,
      }),
    ],
  };
}) satisfies UserConfigFnObject;
