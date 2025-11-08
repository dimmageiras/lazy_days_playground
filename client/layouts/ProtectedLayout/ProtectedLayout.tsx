import type { JSX } from "react";
import { Outlet } from "react-router";

const ProtectedLayout = (): JSX.Element => {
  return <Outlet />;
};

export { ProtectedLayout };
