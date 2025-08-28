import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  buildDirectory: "dist",
  future: {
    unstable_middleware: true,
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    unstable_viteEnvironmentApi: true,
  },
  serverBuildFile: "index.js",
  ssr: true,
} satisfies Config;
