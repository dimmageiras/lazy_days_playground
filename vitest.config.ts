import { mergeConfig } from "vite";
import type { ViteUserConfig } from "vitest/config";
import { defineConfig } from "vitest/config";

import serverConfig from "./.configs/vite/server.config";
import sharedConfig from "./.configs/vite/shared.config";

const vitestConfig = defineConfig(({ mode }) => {
  // `extends: true` re-evaluates this config once per project with the default
  // mode ("test"), dropping the CLI `--mode=debug` seen on the root pass. The
  // root pass runs first in the same process, so persist the probe intent on
  // `process.env` there and resolve the flag from it on every pass.
  if (mode === "debug") {
    process.env.DEBUG_TEST_POLLUTION = "1";
  }

  return mergeConfig(sharedConfig, {
    test: {
      // Kept `false` deliberately: under parallel hooks + concurrent tests,
      // clearing shared mocks between tests would race siblings sharing the
      // worker. Specs filter `mock.calls` by per-test identity instead, so
      // cross-test accumulation is harmless.
      clearMocks: false,
      // Root-only in projects mode — `coverage` cannot live on a project, so it
      // stays here and spans both chunks. The other shared run options below
      // reach each project through `extends: true`.
      coverage: {
        // `**/index.ts` is excluded on the project-wide convention that
        // barrels are pure re-exports. If a future `index.ts` grows
        // executable logic, that file (or the convention) needs revisiting.
        exclude: [
          "**/*.constant.ts",
          "**/*.d.ts",
          "**/*.spec.{ts,tsx}",
          "**/*.type.ts",
          "**/*.wrapper.ts",
          "**/index.ts",
        ],
        include: ["app/**/*.{ts,tsx}"],
        provider: "v8",
        reporter: ["text", "json", "html", "json-summary"],
        reportOnFailure: true,
        reportsDirectory: "logs/unit-tests-coverage",
      },
      env: {
        DEBUG_TEST_POLLUTION:
          process.env.DEBUG_TEST_POLLUTION === "1" ? "1" : "0",
      },
      globals: false,
      // `isolate: false` keeps a single worker context per file (faster startup).
      // Test infra helpers must remain stateless dispatchers — any module-level
      // state in `.configs/vitest/helpers/**` outlives every spec in the worker
      // and will leak between files. Flip to `isolate: true` if that contract
      // ever needs relaxing.
      isolate: false,
      pool: "threads",
      projects: [
        {
          extends: true,
          test: {
            environment: "node",
            include: ["app/shared/**/*.spec.{ts,tsx}"],
            name: "shared",
          },
        },
        mergeConfig(serverConfig, {
          extends: true,
          test: {
            environment: "node",
            include: ["app/server/**/*.spec.{ts,tsx}"],
            name: "server",
          },
        }),
      ],
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
  } satisfies ViteUserConfig);
});

export default vitestConfig;
