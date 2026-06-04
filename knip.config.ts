import type { KnipConfig } from "knip";

const knipConfig: KnipConfig = {
  $schema: "https://unpkg.com/knip@6/schema.json",
  entry: ["app/server/start.ts", ".configs/vite/server.config.ts"],
  ignoreDependencies: ["pino-pretty"],
  project: [".configs/**/*.ts", "app/**/*.{ts,tsx}"],
};

export default knipConfig;
