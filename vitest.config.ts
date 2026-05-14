import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["**/*.d.ts", "**/*.spec.{ts,tsx}"],
      include: ["app/shared/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      reportOnFailure: true,
      reportsDirectory: "logs/unit-tests-coverage",
    },
    environment: "happy-dom",
    globals: true,
    include: ["app/**/*.spec.{ts,tsx}"],
    isolate: false,
    pool: "threads",
    sequence: {
      concurrent: true,
      hooks: "parallel",
      setupFiles: "list",
      shuffle: {
        files: true,
        tests: true,
      },
    },
    setupFiles: [".configs/vitest/setup.ts"],
  },
});

export default vitestConfig;
