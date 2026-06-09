import type { KnipConfig } from "knip";

const knipConfig: KnipConfig = {
  $schema: "https://unpkg.com/knip@6/schema.json",
  entry: [
    ".configs/vite/server.config.ts",
    "app/**/*.d.ts",
    "app/server/start.ts",
  ],
  ignoreDependencies: ["pino-pretty"],
  project: [".configs/**/*.ts", "app/**/*.{ts,tsx}"],
};

export default knipConfig;
