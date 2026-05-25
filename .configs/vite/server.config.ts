import type { UserConfig, UserConfigFnObject } from "vite";
import { defineConfig, mergeConfig } from "vite";

import sharedConfig from "./shared.config";

const serverConfig = defineConfig(() =>
  mergeConfig(sharedConfig, {
    resolve: {
      conditions: ["node"],
    },
  } satisfies UserConfig),
) satisfies UserConfigFnObject;

export default serverConfig;
