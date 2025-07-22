import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

const home = index("pages/Home/index.ts");
const calendar = route("/calendar", "pages/Calendar/index.ts");
const signin = route("/signin", "pages/Signin/index.ts");
const staff = route("/staff", "pages/Staff/index.ts");
const treatments = route("/treatments", "pages/Treatments/index.ts");
const userProfile = route("/profile", "pages/UserProfile/index.ts");

const notTreatmentPages = [home, calendar, signin, staff, userProfile];
const notTreatmentPageLayout = layout(
  "layouts/NotTreatmentPageLayout/index.ts",
  notTreatmentPages
);

const appLayout = layout("layouts/AppLayout/index.ts", [
  notTreatmentPageLayout,
  treatments,
]);

const routes: RouteConfig = [appLayout];

export default routes;
