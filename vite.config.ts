import { reactRouter } from "@react-router/dev/vite";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig } from "vite";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

import { MODES } from "./shared/constants/root-env.constant.ts";

export default defineConfig(({ mode }) => {
  const isDev = mode === MODES.DEVELOPMENT && !process.env.VITEST;

  return {
    plugins: [
      reactRouterDevTools(),
      reactRouter(),
      tsConfigPaths(),
      isDev &&
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
