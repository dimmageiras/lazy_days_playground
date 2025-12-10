import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  buildDirectory: "build",
  future: {
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    unstable_viteEnvironmentApi: true,
  },
  serverBuildFile: "index.js",
  ssr: true,
} satisfies Config;
