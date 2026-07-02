import { Set } from "immutable";

const DB_CLIENT_TLS_SECURITY = Set([
  "insecure",
  "no_host_verification",
  "strict",
] as const);

export { DB_CLIENT_TLS_SECURITY };
