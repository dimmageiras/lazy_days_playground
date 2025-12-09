import { defineConfig } from "vitest/config";

export default defineConfig({
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
