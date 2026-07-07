import { ROUTE_NAMESPACES } from "./route-namespaces.constant";

const { API } = ROUTE_NAMESPACES;

const API_PREFIXES = Object.freeze({
  DOCS: "docs",
  HEALTH: "health",
  INTERNAL: "internal",
} as const);

const BASE_URLS = Object.freeze({
  API_DOCS: `/${API}/${API_PREFIXES.DOCS}`,
  API_HEALTH: `/${API}/${API_PREFIXES.HEALTH}`,
  API_INTERNAL: `/${API}/${API_PREFIXES.INTERNAL}`,
} as const);

export { BASE_URLS };
