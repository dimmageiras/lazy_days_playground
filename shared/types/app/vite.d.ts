import type { ServerBuild } from "react-router";

import "vite";

/**
 * Type augmentation for Vite's SSR module loading.
 * Vite's built-in types don't specify the ServerBuild return type
 * needed for React Router integration.
 */
declare module "vite" {
  export interface ViteDevServer {
    ssrLoadModule(
      url: string,
      opts?: {
        fixStacktrace?: boolean;
      }
    ): Promise<ServerBuild>;
  }
}
