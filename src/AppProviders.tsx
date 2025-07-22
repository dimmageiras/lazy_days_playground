import { QueryClientProvider } from "@tanstack/react-query";
import type { JSX, PropsWithChildren } from "react";

import { ReactQueryConfig } from "./configs/react-query.config";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>{children}</QueryClientProvider>
  );
};

export { AppProviders };
