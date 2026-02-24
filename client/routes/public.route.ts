import { index, route } from "@react-router/dev/routes";

import { IS_DEVELOPMENT } from "../../shared/constants/root-env.constant";
import { ROUTES_CONSTANTS } from "./constants/routes.constant";

const { INDEX_FILE } = ROUTES_CONSTANTS;

// Health and documentation routes
const apiDocs = route("/api/docs", `pages/ApiDocs/${INDEX_FILE}`);
const apiHealth = route("/api/health", `pages/ApiHealth/${INDEX_FILE}`);

// Public routes
const auth = route("/auth", `pages/Auth/${INDEX_FILE}`);
const calendar = route("/calendar", `pages/Calendar/${INDEX_FILE}`);
const home = index(`pages/Home/${INDEX_FILE}`);
const staff = route("/staff", `pages/Staff/${INDEX_FILE}`);
const treatments = route("/treatments", `pages/Treatments/${INDEX_FILE}`);

const publicRoutes = [
  ...(IS_DEVELOPMENT ? [apiDocs] : []),
  apiHealth,
  auth,
  calendar,
  home,
  staff,
  treatments,
];

export { publicRoutes };
