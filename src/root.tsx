import type { JSX } from "react";
import type { LinkDescriptor } from "react-router";

import { Outlet } from "react-router";

import "./root.scss";

import { ErrorBoundary } from "./components/ErrorBoundary";
import RootLayout from "./layouts/RootLayout";
import { rootLoader } from "./loaders/root.loader";

export const root = (): LinkDescriptor[] => [
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

export {
  ErrorBoundary,
  Root as default,
  RootLayout as Layout,
  rootLoader as loader,
};
