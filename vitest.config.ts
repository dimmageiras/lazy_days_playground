import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    coverage: {
      exclude: [
        "**/*.config.*",
        "**/*.d.ts",
        "**/*.schema.ts",
        "**/*.type.ts",
        "**/coverage/**",
        "dist/",
        "index.ts",
        "node_modules/",
      ],
      // TO-DO: Re-enable include when we have more tests in place
      // include: [
      //   "client/**/*.{ts,tsx}",
      //   "server/**/*.{ts,tsx}",
      //   "shared/**/*.{ts,tsx}",
      // ],
      provider: "v8",
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

export default vitestConfig;
