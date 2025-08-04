import type { JSX } from "react";
import { Outlet } from "react-router";

const StandardPageLayout = (): JSX.Element => {
  return <Outlet />;
};

export { StandardPageLayout };
