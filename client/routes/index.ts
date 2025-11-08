import type { RouteConfig } from "@react-router/dev/routes";
import { layout } from "@react-router/dev/routes";

import { ROUTES_CONSTANTS } from "./constants/routes.constants";
import { protectedRoutes } from "./protected.route";
import { publicRoutes } from "./public.route";

const { INDEX_FILE } = ROUTES_CONSTANTS;

const appLayout = layout(`layouts/AppLayout/${INDEX_FILE}`, [
  ...publicRoutes,
  layout(`layouts/ProtectedLayout/${INDEX_FILE}`, protectedRoutes),
]);

const routes: RouteConfig = [appLayout];

export { routes };
