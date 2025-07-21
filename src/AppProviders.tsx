import type { JSX, PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { ReactQueryConfig } from "./configs/react-query.config";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>{children}</QueryClientProvider>
  );
};

export { AppProviders };
