import type { Route } from "@rr/types/client/layouts/AppLayout/+types";
import type { JSX } from "react";
import { Outlet } from "react-router";

import { NavBar } from "@client/layouts/AppLayout/components/NavBar";

const AppLayout = ({ loaderData }: Route.ComponentProps): JSX.Element => {
  const { authData } = loaderData;

  return (
    <>
      <NavBar authData={authData} />
      <Outlet />
    </>
  );
};

export { AppLayout };
