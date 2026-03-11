import { index, route } from "@react-router/dev/routes";

import { IS_DEVELOPMENT } from "../../shared/constants/root-env.constant";
import { ROUTES_CONSTANTS } from "./constants/routes.constant";

const { INDEX_FILE, ROUTE_PATHS } = ROUTES_CONSTANTS;
const { API_DOCS, API_HEALTH, AUTH, CALENDAR, STAFF, TREATMENTS } = ROUTE_PATHS;

// Health and documentation routes
const apiDocs = route(`/${API_DOCS}`, `pages/ApiDocs/${INDEX_FILE}`);
const apiHealth = route(`/${API_HEALTH}`, `pages/ApiHealth/${INDEX_FILE}`);

// Public routes
const auth = route(`/${AUTH}`, `pages/Auth/${INDEX_FILE}`);
const calendar = route(`/${CALENDAR}`, `pages/Calendar/${INDEX_FILE}`);
const home = index(`pages/Home/${INDEX_FILE}`);
const staff = route(`/${STAFF}`, `pages/Staff/${INDEX_FILE}`);
const treatments = route(`/${TREATMENTS}`, `pages/Treatments/${INDEX_FILE}`);

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
