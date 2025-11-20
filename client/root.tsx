import type { JSX } from "react";
import { Outlet } from "react-router";

import { rootLoader as loader } from "@client/root/loaders/root.loader";
import type { CSPNonceContextValue } from "@shared/types/csp.type";

import "./root.scss";
import "iconify-icon";
import "./configs/axios.config";

import type { Route } from "./+types/root";
import Layout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";
import { rootMiddleware } from "./root/middlewares/root.middleware";
import { AppProviders } from "./root/providers/AppProviders";

const middleware = [rootMiddleware];

const Root = ({ loaderData, matches }: Route.ComponentProps): JSX.Element => {
  const { cspNonce } = loaderData;

  return (
    <AppProviders matches={matches}>
      <Outlet context={{ cspNonce } satisfies CSPNonceContextValue} />
    </AppProviders>
  );
};

export { ErrorBoundary, Layout, loader, middleware };
export default Root;
