import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  resolve: {
    // Vite 8: `tsconfigPaths` resolves against the closest tsconfig; behaviour
    // around project `references` is version-sensitive — re-verify on bumps.
    tsconfigPaths: true,
  },
  test: {
    // Kept `false` deliberately. Under `sequence.hooks: "parallel"` +
    // `sequence.concurrent: true`. The project's specs
    // already filter `mock.calls` by per-test identity (e.g. `app`/`app.log`
    // reference), so cross-test accumulation is harmless.
    clearMocks: false,
    coverage: {
      // `**/index.ts` is excluded on the project-wide convention that
      // barrels are pure re-exports. If a future `index.ts` grows
      // executable logic, that file (or the convention) needs revisiting.
      exclude: [
        "**/*.constant.ts",
        "**/*.d.ts",
        "**/*.spec.{ts,tsx}",
        "**/*.type.ts",
        "**/index.ts",
      ],
      include: ["app/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      reportOnFailure: true,
      reportsDirectory: "logs/unit-tests-coverage",
    },
    environment: "happy-dom",
    globals: false,
    include: ["app/**/*.spec.{ts,tsx}"],
    // `isolate: false` keeps a single worker context per file (faster startup).
    // Test infra helpers must remain stateless dispatchers — any module-level
    // state in `.configs/vitest/helpers/**` outlives every spec in the worker
    // and will leak between files. Flip to `isolate: true` if that contract
    // ever needs relaxing.
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
