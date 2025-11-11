import type { Route } from "@rr/types/client/layouts/AppLayout/+types";
import type { JSX } from "react";
import { Outlet } from "react-router";

import { NavBar } from "@client/layouts/AppLayout/components/NavBar";
import { ClientSessionProvider } from "@client/providers/ClientSessionProvider";

const AppLayout = ({ loaderData }: Route.ComponentProps): JSX.Element => {
  const { clientId, isAuthenticated } = loaderData;

  return (
    <ClientSessionProvider
      clientId={clientId ?? ""}
      isAuthenticated={isAuthenticated}
    >
      <NavBar />
      <Outlet />
    </ClientSessionProvider>
  );
};

export { AppLayout };
