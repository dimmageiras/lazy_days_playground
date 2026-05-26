import type { UserConfig } from "vite";
import { defineConfig } from "vite";

const sharedConfig = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
} satisfies UserConfig);

export default sharedConfig;
