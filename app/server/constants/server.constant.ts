// TO-DO Values parked here are slated to move into an env-loaded settings layer.
// Until that layer exists, they live as a single typed bag so each call site
// reads from one place — keeps the env-migration to a one-file-change story.
const SERVER_SETTINGS = Object.freeze({
  FATAL_FLUSH_TIMEOUT_MS: 1_000,
  LOG_LEVEL: "info",
  PORT: 5173,
  SHUTDOWN_TOKEN: "dev-shutdown-token",
} as const);

export { SERVER_SETTINGS };
