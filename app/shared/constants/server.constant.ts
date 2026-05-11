const SERVER_SETTINGS = Object.freeze({
  PORT: 5173,
  SHUTDOWN_PATH: "/internal/shutdown",
  SHUTDOWN_TOKEN: "dev-shutdown-token",
} as const);

export { SERVER_SETTINGS };
