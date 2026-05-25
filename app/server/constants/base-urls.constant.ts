import { ROUTE_NAMESPACES } from "./route-namespaces.constant";

const { API } = ROUTE_NAMESPACES;

const API_HEALTH_PREFIX = "health" as const;

const BASE_URLS = Object.freeze({
  API: { HEALTH: `/${API}/${API_HEALTH_PREFIX}` },
} as const);

export { BASE_URLS };
