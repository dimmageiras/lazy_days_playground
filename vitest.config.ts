import { mergeConfig } from "vite";
import type {
  TestProjectInlineConfiguration,
  ViteUserConfig,
} from "vitest/config";
import { defineConfig } from "vitest/config";

import sharedConfig from "./.configs/vite/shared.config";

const vitestConfig = defineConfig(({ mode }) => {
  if (mode === "debug") {
    process.env.DEBUG_TEST_POLLUTION = "1";
  }

  const isPollutionProbeEnabled = process.env.DEBUG_TEST_POLLUTION === "1";

  if (
    (mode === "debug" || process.argv.includes("--mode=debug")) &&
    !isPollutionProbeEnabled
  ) {
    throw new Error(
      "Pollution probe requested via --mode=debug but DEBUG_TEST_POLLUTION did not resolve to enabled; the mode-to-env round-trip in vitest.config.ts likely broke under projects-mode re-evaluation.",
    );
  }

  return mergeConfig(sharedConfig, {
    test: {
      clearMocks: false,
      coverage: {
        exclude: [
          "**/*.constant.ts",
          "**/*.d.ts",
          "**/*.spec.{ts,tsx}",
          "**/*.type.ts",
          "**/*.wrapper.ts",
          "**/index.ts",
          "**/start.ts",
        ],
        include: ["app/**/*.{ts,tsx}"],
        provider: "v8",
        reporter: ["text", "json", "html", "json-summary"],
        reportOnFailure: true,
        reportsDirectory: "logs/unit-tests-coverage",
      },
      env: {
        DEBUG_TEST_POLLUTION: isPollutionProbeEnabled ? "1" : "0",
      },
      globals: false,
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
        } satisfies TestProjectInlineConfiguration,
        {
          extends: true,
          resolve: {
            conditions: ["node"],
          },
          test: {
            environment: "node",
            include: ["app/server/**/*.spec.{ts,tsx}"],
            name: "server",
          },
        } satisfies TestProjectInlineConfiguration,
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
