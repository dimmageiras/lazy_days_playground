import type { RouteConfig } from "@react-router/dev/routes";

import { index, layout } from "@react-router/dev/routes";

const home = index("pages/Home/index.ts");

const routes: RouteConfig = [layout("layouts/AppLayout/index.ts", [home])];

export default routes;
