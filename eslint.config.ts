import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";

import pluginJS from "@eslint/js";
import { plugin as pluginTanstackQuery } from "@tanstack/eslint-plugin-query";
import tsParser from "@typescript-eslint/parser";
import { globalIgnores } from "eslint/config";
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

export default tsEslint.config([
  globalIgnores([".react-router", "dist", "logs"]),
  {
    extends: [
      pluginJS.configs.recommended,
      tsEslint.configs.recommended,
      pluginReact.configs.flat.recommended ?? {},
      pluginReact.configs.flat["jsx-runtime"] ?? {},
      pluginReactHooks.configs["recommended-latest"],
      pluginReactRefresh.configs.vite,
      ...pluginTanstackQuery.configs["flat/recommended"],
    ],
    files: ["**/*.{ts,tsx}"],
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
      "css-modules": pluginCSSModules as FlatConfig.Plugin,
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
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              message: "Please use ~/ instead of ../",
              regex: "\\.\\.\\/(?!.*\\.module\\.scss).*",
            },
            {
              message:
                "SCSS files should use ./ (same directory) instead of ~/",
              regex: "^~\\/.*\\.module\\.scss$",
            },
            {
              message:
                "SCSS files should use ./ (same directory) instead of ../",
              regex: "\\.\\.\\/(.*\\.module\\.scss).*",
            },
          ],
        },
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
        { blankLine: "any", prev: "case", next: "case" },
        { blankLine: "any", prev: ["case", "default"], next: "break" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
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
      "react/self-closing-comp": "error",
      "react-refresh/only-export-components": "error",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "error",
      // Import order: types first, then external, internal (~), relative (.)
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^@?\\w.*\\u0000$", "^@src.*\\u0000$", "^\\..*\\u0000$"],
            ["^@?\\w"],
            ["^\\u0000"],
            ["^~"],
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
    files: ["**/*.config.ts", "**/*.d.ts", "src/root.tsx", "./src/routes.ts"],
    rules: {
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: false } },
      ],
    },
  },
  // Root component: disable React-specific restrictions
  {
    files: ["src/root.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]) satisfies FlatConfig.ConfigArray;
