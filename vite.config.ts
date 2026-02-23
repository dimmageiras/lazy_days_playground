import { reactRouter } from "@react-router/dev/vite";
import path from "node:path";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig } from "vite";
import pluginBabel from "vite-plugin-babel";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

import {
  HAS_DEV_TOOLS,
  HAS_RRDT,
} from "./shared/constants/root-env.constant.ts";

const viteConfig = defineConfig(() => {
  return {
    plugins: [
      HAS_DEV_TOOLS &&
        HAS_RRDT &&
        reactRouterDevTools({
          includeInProd: {
            client: false,
            devTools: false,
            server: false,
          },
        }),
      reactRouter(),
      pluginBabel({
        babelConfig: {
          plugins: [
            "@babel/plugin-transform-explicit-resource-management",
            "babel-plugin-react-compiler",
          ],
          presets: ["@babel/preset-typescript"],
        },
        filter: (name) => name.endsWith("tsx"),
        loader: "tsx",
        include: ["./client/**/*"],
      }),
      tsConfigPaths(),
      pluginChecker({
        enableBuild: false,
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
    resolve: {
      alias: {
        "@client": path.resolve(__dirname, "client"),
      },
    },
    server: {
      hmr: {
        clientPort: 24678,
      },
    },
  };
}) satisfies UserConfigFnObject;

export default viteConfig;
