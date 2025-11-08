import { route } from "@react-router/dev/routes";

import { ROUTES_CONSTANTS } from "./constants/routes.constants";

const { INDEX_FILE } = ROUTES_CONSTANTS;

// Protected routes
const userProfile = route("/profile", `pages/UserProfile/${INDEX_FILE}`);

const protectedRoutes = [userProfile];

export { protectedRoutes };
