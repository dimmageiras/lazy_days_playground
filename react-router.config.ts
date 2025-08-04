import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "client",
  buildDirectory: "dist",
  future: {
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    unstable_viteEnvironmentApi: true,
  },
  ssr: true,
} satisfies Config;
