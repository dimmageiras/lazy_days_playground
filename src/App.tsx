import type { JSX } from "react";

import { StrictMode } from "react";
import { Outlet } from "react-router";

import "./App.scss";

import { AppProviders } from "./AppProviders";

const App = (): JSX.Element => {
  return (
    <StrictMode>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </StrictMode>
  );
};

export { App };
