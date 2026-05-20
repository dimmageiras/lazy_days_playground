import { ROUTES } from "./routes.constant";

const { INTERNAL_BASE } = ROUTES;

const INTERNAL_PATHS = Object.freeze({
  SHUTDOWN: `${INTERNAL_BASE}/shutdown`,
} as const);

export { INTERNAL_PATHS };
