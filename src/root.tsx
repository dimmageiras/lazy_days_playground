import type { JSX } from "react";
import type { LinkDescriptor } from "react-router";
import { isRouteErrorResponse, Outlet } from "react-router";

import "./root.scss";
import "iconify-icon";

import type { Route } from "./+types/root";
import { AppProviders } from "./AppProviders";
import RootLayout from "./layouts/RootLayout";

const links = (): LinkDescriptor[] => [
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

const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps): JSX.Element => {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack ? (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      ) : null}
    </main>
  );
};

export { ErrorBoundary, links, Root as default, RootLayout as Layout };
