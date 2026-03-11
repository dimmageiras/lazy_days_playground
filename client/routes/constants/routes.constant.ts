const INDEX_FILE = "index.ts" as const;

const ROUTE_PATHS = Object.freeze({
  API_DOCS: "api/docs",
  API_HEALTH: "api/health",
  AUTH: "auth",
  CALENDAR: "calendar",
  HOME: "/",
  STAFF: "staff",
  TREATMENTS: "treatments",
  USER_PROFILE: "user-profile",
} as const);

const ROUTES_CONSTANTS = Object.freeze({
  INDEX_FILE,
  ROUTE_PATHS,
} as const);

export { ROUTES_CONSTANTS };
