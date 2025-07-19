import type { JSX, PropsWithChildren } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { ReactQueryConfig } from "./configs/react-query.config";

const AppProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <QueryClientProvider {...ReactQueryConfig}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export { AppProviders };
