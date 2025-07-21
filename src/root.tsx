import type { JSX } from "react";
import type { LinkDescriptor } from "react-router";

import { Outlet } from "react-router";

import "./root.scss";

import { ErrorBoundary } from "./components/ErrorBoundary";
import RootLayout from "./layouts/RootLayout";

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
  return <Outlet />;
};

export { ErrorBoundary, RootLayout as Layout, Root as default };
