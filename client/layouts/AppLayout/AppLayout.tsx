import type { JSX } from "react";
import { Outlet } from "react-router";

import { NavBar } from "@client/layouts/AppLayout/components/NavBar";

const AppLayout = (): JSX.Element => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

export { AppLayout };
