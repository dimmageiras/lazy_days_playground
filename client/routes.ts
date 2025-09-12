import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

import { IS_DEVELOPMENT } from "../shared/constants/root-env.constant";

const INDEX_FILE = "index.ts";

const apiDocs = route("/api/docs", `pages/ApiDocs/${INDEX_FILE}`);
const apiHealth = route("/api/health", `pages/ApiHealth/${INDEX_FILE}`);

const home = index(`pages/Home/${INDEX_FILE}`);
const calendar = route("/calendar", `pages/Calendar/${INDEX_FILE}`);
const signin = route("/signin", `pages/Signin/${INDEX_FILE}`);
const staff = route("/staff", `pages/Staff/${INDEX_FILE}`);
const treatments = route("/treatments", `pages/Treatments/${INDEX_FILE}`);
const userProfile = route("/profile", `pages/UserProfile/${INDEX_FILE}`);

const notTreatmentPages = [
  ...(IS_DEVELOPMENT ? [apiDocs, apiHealth] : []),
  home,
  calendar,
  signin,
  staff,
  userProfile,
];
const standardPageLayout = layout(
  `layouts/StandardPageLayout/${INDEX_FILE}`,
  notTreatmentPages
);

const appLayout = layout(`layouts/AppLayout/${INDEX_FILE}`, [
  standardPageLayout,
  treatments,
]);

const routes: RouteConfig = [appLayout];

export default routes;
