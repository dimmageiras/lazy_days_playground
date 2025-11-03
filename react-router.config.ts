import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  buildDirectory: "dist",
  future: {
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    unstable_subResourceIntegrity: true,
    unstable_viteEnvironmentApi: true,
    v8_middleware: true,
  },
  serverBuildFile: "index.js",
  ssr: true,
} satisfies Config;
