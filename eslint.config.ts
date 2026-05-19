import pluginJS from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import pluginSecurity from "eslint-plugin-security";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import { configs as pluginSonarjsConfigs } from "eslint-plugin-sonarjs";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tsEslint from "typescript-eslint";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores([".claude", ".tsc-cache", "logs"]),
  {
    extends: [
      pluginJS.configs.recommended,
      tsEslint.configs.recommended,
      pluginSonarjsConfigs.recommended,
      pluginSecurity.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.node,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          arrowFunctions: true,
          classes: false,
          destructuring: true,
          spread: true,
        },
        projectService: true,
        sourceType: "module",
        tsconfigRootDir,
      },
    },
    plugins: {
      "simple-import-sort": pluginSimpleImportSort,
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["error", "info", "warn"] }],
      "no-constant-binary-expression": "error",
      "no-nested-ternary": "error",
      "no-param-reassign": "error",
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true } },
      ],
      "no-use-before-define": "error",
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "*", next: "block" },
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "block", next: "*" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        { blankLine: "any", prev: "case", next: ["case", "default"] },
        { blankLine: "any", prev: ["case", "default"], next: "break" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            [String.raw`^@?\w`],
            ["^@shared"],
            [String.raw`^\u0000`],
            [String.raw`^\.`],
          ],
        },
      ],
      "sonarjs/no-unused-vars": "off",
      curly: ["error", "all"],
    },
  },
  // Test files: disable SonarJS assertions rule
  {
    files: ["**/*.spec.{ts,tsx}"],
    rules: {
      "sonarjs/assertions-in-tests": "off",
    },
  },
  // Config files and entry points: allow default exports
  {
    files: ["**/*.config.ts", "**/*.d.ts"],
    rules: {
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: false } },
      ],
    },
  },
]) satisfies Linter.Config[];
