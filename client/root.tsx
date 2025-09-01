import type { JSX } from "react";
import { Outlet } from "react-router";

import "./root.scss";
import "iconify-icon";
import "./configs/axios.config";

import RootLayout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";
import { AppProviders } from "./root/providers/AppProviders";

const Root = (): JSX.Element => {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
};

export { ErrorBoundary, Root as default, RootLayout as Layout };
