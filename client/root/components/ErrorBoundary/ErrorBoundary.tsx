import type { Route } from "@Router/types/client/+types/root";
import type { JSX } from "react";
import { isRouteErrorResponse } from "react-router";

import { IS_DEVELOPMENT } from "@Client/constants/env.constants";

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
  } else if (IS_DEVELOPMENT && error && error instanceof Error) {
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

export { ErrorBoundary };
