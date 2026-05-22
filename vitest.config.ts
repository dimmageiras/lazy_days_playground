import type { ViteUserConfig } from "vitest/config";
import { defineConfig } from "vitest/config";

// `--mode=debug` toggles the pollution probe via `test.env`; keeps the script
// surface POSIX/cmd-agnostic without a cross-env shim.
const vitestConfig = defineConfig(
  ({ mode }) =>
    ({
      resolve: {
        tsconfigPaths: true,
      },
      test: {
        // Kept `false` deliberately: under parallel hooks + concurrent tests,
        // clearing shared mocks between tests would race siblings sharing the
        // worker. Specs filter `mock.calls` by per-test identity instead, so
        // cross-test accumulation is harmless.
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
        env: {
          DEBUG_TEST_POLLUTION: mode === "debug" ? "1" : "0",
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
    }) satisfies ViteUserConfig,
);

export default vitestConfig;
