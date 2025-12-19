import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    coverage: {
      exclude: [
        "**/*.config.*",
        "**/*.d.ts",
        "**/coverage/**",
        "dist/",
        "node_modules/",
      ],
      provider: "v8",
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

export default vitestConfig;
