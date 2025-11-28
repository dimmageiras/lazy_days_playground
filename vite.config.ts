import { reactRouter } from "@react-router/dev/vite";
import { reactRouterDevTools } from "react-router-devtools";
import type { UserConfigFnObject } from "vite";
import { defineConfig } from "vite";
import pluginBabel from "vite-plugin-babel";
import pluginChecker from "vite-plugin-checker";
import tsConfigPaths from "vite-tsconfig-paths";

const viteConfig = defineConfig(() => {
  return {
    plugins: [
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
    server: {
      hmr: {
        clientPort: 24678,
      },
    },
  };
}) satisfies UserConfigFnObject;

export default viteConfig;
