import { reactRouter } from "@react-router/dev/vite";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig } from "vite";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

import { MODES } from "./shared/constants/root-env.constants.ts";

export default defineConfig(({ mode }) => {
  const isDev = mode === MODES.DEVELOPMENT;

  return {
    plugins: [
      isDev && reactRouterDevTools(),
      reactRouter(),
      tsConfigPaths(),
      !process.env.VITEST &&
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
