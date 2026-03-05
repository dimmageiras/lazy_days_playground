import type { JSX } from "react";
import { Outlet } from "react-router";

import { rootLoader as loader } from "@client/root/loaders/root.loader";
import type { ApiSecurityContextValue } from "@shared/types/api-security.type";

import "./root.scss";
import "iconify-icon";

import type { Route } from "./+types/root";
import { initAxios } from "./configs/axios.config";
import Layout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";
import { rootMiddleware } from "./root/middlewares/root.middleware";
import { AppProviders } from "./root/providers/AppProviders";

const middleware = [rootMiddleware];

const Root = ({ loaderData, matches }: Route.ComponentProps): JSX.Element => {
  const { cspNonce, csrfToken }: ApiSecurityContextValue = loaderData;
  const outletContext: ApiSecurityContextValue = { cspNonce, csrfToken };

  initAxios(csrfToken);

  return (
    <AppProviders matches={matches}>
      <Outlet context={outletContext} />
    </AppProviders>
  );
};

export { ErrorBoundary, Layout, loader, middleware };
export default Root;
