import type { JSX } from "react";
import type { LinkDescriptor } from "react-router";
import { Outlet } from "react-router";

import "./root.scss";
import "iconify-icon";

import { AppProviders } from "./AppProviders";
import RootLayout from "./layouts/RootLayout";
import { ErrorBoundary } from "./root/components/ErrorBoundary";

export const links = (): LinkDescriptor[] => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Forum&family=Lato&display=swap",
  },
];

const Root = (): JSX.Element => {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
};

export { ErrorBoundary, Root as default, RootLayout as Layout };
