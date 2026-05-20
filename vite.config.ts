import type { UserConfig } from "vite";

export default {
  resolve: {
    // Vite 8: `tsconfigPaths` resolves against the closest tsconfig; behaviour
    // around project `references` is version-sensitive — re-verify on bumps.
    tsconfigPaths: true,
  },
} satisfies UserConfig;
