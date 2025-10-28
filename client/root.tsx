import type { JSX } from "react";
import { Outlet } from "react-router";

import "./root.scss";
import "iconify-icon";
import "./configs/axios.config";

import type { Route } from "./+types/root";
import Layout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";
import { AppProviders } from "./root/providers/AppProviders";

const Root = ({ matches }: Route.ComponentProps): JSX.Element => {
  return (
    <AppProviders matches={matches}>
      <Outlet />
    </AppProviders>
  );
};

export { ErrorBoundary, Layout };
export default Root;
