import type { JSX } from "react";
import { memo } from "react";
import { Outlet } from "react-router";

import "./root.scss";
import "iconify-icon";
import "./configs/axios.config";

import RootLayout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";
import { AppProviders } from "./root/providers/AppProviders";

const Root = memo((): JSX.Element => {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
});

Root.displayName = "Root";

export { ErrorBoundary, Root as default, RootLayout as Layout };
