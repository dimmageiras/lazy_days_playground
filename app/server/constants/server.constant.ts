// TO-DO: Consider moving this to a .env file for better security and configurability
const SERVER_SETTINGS = Object.freeze({
  HOST_LOOPBACK: "127.0.0.1",
  PORT: 5173,
  SHUTDOWN_TOKEN: "dev-shutdown-token",
} as const);

export { SERVER_SETTINGS };
