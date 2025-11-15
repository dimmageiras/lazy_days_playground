import pluginJS from "@eslint/js";
import { plugin as pluginTanstackQuery } from "@tanstack/eslint-plugin-query";
import tsParser from "@typescript-eslint/parser";
import type { ESLint, Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import * as pluginCSSModules from "eslint-plugin-css-modules";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import pluginSecurity from "eslint-plugin-security";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tsEslint from "typescript-eslint";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores([
    ".react-router",
    "dist",
    "logs",
    "shared/types/generated/db/database.type.ts",
  ]),
  {
    extends: [
      pluginJS.configs.recommended,
      tsEslint.configs.recommended,
      pluginReact.configs.flat.recommended ?? {},
      pluginReact.configs.flat["jsx-runtime"] ?? {},
      pluginReactHooks.configs.flat["recommended-latest"] ?? {},
      pluginReactRefresh.configs.vite,
      ...pluginTanstackQuery.configs["flat/recommended"],
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
          jsx: true,
          spread: true,
        },
        projectService: true,
        sourceType: "module",
        tsconfigRootDir,
      },
    },
    plugins: {
      "css-modules": pluginCSSModules as ESLint.Plugin,
      "simple-import-sort": pluginSimpleImportSort,
      security: pluginSecurity,
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
      "css-modules/no-unused-class": ["error", { camelCase: true }],
      "css-modules/no-undef-class": ["error", { camelCase: true }],
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
      "react/boolean-prop-naming": [
        "error",
        {
          rule: "^(can|has|is|should)([A-Z]([A-Za-z0-9]+)?)?$",
        },
      ],
      "react/function-component-definition": [
        "error",
        { namedComponents: "arrow-function" },
      ],
      "react/jsx-curly-brace-presence": "error",
      "react/jsx-filename-extension": [
        "error",
        { allow: "as-needed", extensions: [".tsx"] },
      ],
      "react/jsx-no-leaked-render": ["error", { validStrategies: ["ternary"] }],
      "react/prop-types": "off",
      "react/self-closing-comp": "error",
      "react-refresh/only-export-components": "error",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^@?\\w"],
            ["^@client", "^@server", "^@shared"],
            ["^\\u0000"],
            ["^\\."],
          ],
        },
      ],
      curly: ["error", "all"],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Test files: disable CSS modules validation
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "css-modules/no-unused-class": "off",
      "css-modules/no-undef-class": "off",
    },
  },
  // Config files and entry points: allow default exports
  {
    files: [
      "**/*.config.ts",
      "**/*.d.ts",
      "client/layouts/**/index.ts",
      "client/pages/**/index.ts",
      "client/root.tsx",
      "client/routes.ts",
      "server/**/*.ts",
    ],
    rules: {
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: false } },
      ],
    },
  },
  // Root component: disable React-specific restrictions
  {
    files: ["client/root.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // Client files: enable restricted imports
  {
    files: ["client/**/*.{ts,tsx}"],
    ignores: ["client/routes.ts", "client/routes/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              message: "Please use @client or @shared instead of ../",
              regex: "\\.\\.\\/(?!.*\\.module\\.scss).*",
            },
            {
              message:
                "SCSS files should use ./ (same directory) instead of @client",
              regex: "^@client\\/.*\\.module\\.scss$",
            },
            {
              message:
                "SCSS files should use ./ (same directory) instead of ../",
              regex: "\\.\\.\\/(.*\\.module\\.scss).*",
            },
          ],
        },
      ],
    },
  },
]) satisfies Linter.Config[];
