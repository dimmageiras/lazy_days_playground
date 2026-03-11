import { route } from "@react-router/dev/routes";

import { ROUTES_CONSTANTS } from "./constants/routes.constant";

const { INDEX_FILE, ROUTE_PATHS } = ROUTES_CONSTANTS;
const { USER_PROFILE } = ROUTE_PATHS;

// Protected routes
const userProfile = route(
  `/${USER_PROFILE}`,
  `pages/UserProfile/${INDEX_FILE}`,
);

const protectedRoutes = [userProfile];

export { protectedRoutes };
