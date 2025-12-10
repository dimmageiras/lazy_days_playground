import type { Config } from "@react-router/dev/config";

const reactRouterConfig = {
  appDirectory: "client",
  buildDirectory: "dist",
  future: {
    unstable_optimizeDeps: true,
    unstable_subResourceIntegrity: true,
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
  },
  serverBuildFile: "index.js",
  ssr: true,
} satisfies Config;

export default reactRouterConfig;
